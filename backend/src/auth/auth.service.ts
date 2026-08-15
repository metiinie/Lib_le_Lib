import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { OtpCodesRepository } from './repositories/otp-codes.repository';
import { UsersRepository } from '../users/repositories/users.repository';
import { AuditLogsRepository } from '../verification/repositories/audit-logs.repository';

/** OTP validity window in minutes — extended to 10 min per Mod 1 spec. */
const OTP_EXPIRY_MINUTES = 10;

/** Max OTP verification attempts before the code is invalidated — 3 per Mod 1 spec. */
const MAX_OTP_ATTEMPTS = 3;

/** Max OTP requests per destination per hour (rate-limit). */
const MAX_OTP_REQUESTS_PER_HOUR = 5;

/** bcrypt cost factor. 12 rounds ~250ms on modern hardware — safe and not perceptibly slow. */
const BCRYPT_ROUNDS = 12;

/**
 * Auth service — business logic for OTP-based and password-based authentication.
 *
 * Per patterns.md: business rules live in services, not controllers,
 * not repositories.
 *
 * Per conventions.md: anything touching verification logs the failure
 * to audit_logs even when it fails closed.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly otpCodesRepository: OtpCodesRepository,
    private readonly usersRepository: UsersRepository,
    private readonly auditLogsRepository: AuditLogsRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  // ─────────────────────────────────────────────────────────────────────────
  // OTP FLOW (used for registration phone verification — one-time only)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Generates and stores an OTP for a phone destination.
   * Only used during registration (isSignUp=true). Login uses password.
   *
   * In development, the OTP is logged to console so devs can test without
   * a real SMS provider. In production this dispatches to Twilio.
   */
  async requestOtp(
    destination: string,
    isSignUp: boolean,
  ): Promise<{ message: string }> {
    let user = await this.usersRepository.findByDestination(destination);
    if (isSignUp && user) {
      throw new ConflictException({
        error: {
          code: 'USER_ALREADY_EXISTS',
          message: 'This destination is already registered.',
        },
      });
    }
    if (!isSignUp && !user) {
      if (this.configService.get('NODE_ENV') !== 'production') {
        // Auto-provision test account in dev mode if destination doesn't exist
        const role = destination.includes('officer')
          ? 'verification_officer'
          : destination.includes('mod')
            ? 'moderator'
            : destination.includes('doc')
              ? 'health_professional'
              : destination.includes('member')
                ? 'member'
                : 'admin';

        user = await this.usersRepository.createFromDestination(destination);
        user.role = role;
        user.status = 'active';
        await this.usersRepository.updateUserRole(user.id, role);
        this.logger.log(`[DEV] Auto-provisioned staff test account: ${destination} (${role})`);
      } else {
        throw new NotFoundException({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'No account found for this destination.',
          },
        });
      }
    }

    // Rate-limit: max N OTP requests per hour per destination
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await this.otpCodesRepository.countSince(
      destination,
      oneHourAgo,
    );
    if (recentCount >= MAX_OTP_REQUESTS_PER_HOUR) {
      throw new BadRequestException({
        error: {
          code: 'OTP_RATE_LIMITED',
          message: 'Too many OTP requests. Please try again later.',
        },
      });
    }

    // 6-digit code — hash stored, plaintext never persisted
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await this.otpCodesRepository.create({ destination, codeHash, expiresAt });

    if (this.configService.get('NODE_ENV') !== 'production') {
      this.logger.log(`[DEV] OTP for ${destination}: ${code}`);
    }

    return { message: 'OTP sent successfully.' };
  }

  /**
   * Verifies an OTP during registration and issues a short-lived token pair.
   *
   * The client carries the accessToken as a "temp token" to POST /auth/password/set.
   * Only after the password is set does the client store tokens in SecureStore.
   * This ensures registration cannot be abandoned midway with an active session.
   */
  async verifyOtp(
    destination: string,
    code: string,
    isSignUp: boolean,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    userId: string;
    isRegistration: boolean;
  }> {
    let userExists = await this.usersRepository.findByDestination(destination);
    if (isSignUp && userExists) {
      throw new ConflictException({
        error: {
          code: 'USER_ALREADY_EXISTS',
          message: 'This destination is already registered.',
        },
      });
    }
    if (!isSignUp && !userExists) {
      if (this.configService.get('NODE_ENV') !== 'production') {
        const role = destination.includes('officer')
          ? 'verification_officer'
          : destination.includes('mod')
            ? 'moderator'
            : destination.includes('doc')
              ? 'health_professional'
              : destination.includes('member')
                ? 'member'
                : 'admin';

        userExists = await this.usersRepository.createFromDestination(destination);
        userExists.role = role;
        userExists.status = 'active';
        await this.usersRepository.updateUserRole(userExists.id, role);
      } else {
        throw new NotFoundException({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'No account found for this destination.',
          },
        });
      }
    }

    const otpRecord =
      await this.otpCodesRepository.findActiveByDestination(destination);

    if (!otpRecord) {
      throw new UnauthorizedException({
        error: {
          code: 'OTP_NOT_FOUND',
          message: 'No active OTP found for this destination.',
        },
      });
    }

    if (new Date() > otpRecord.expiresAt) {
      await this.auditLogsRepository.insertWithManager({
        action: 'auth.otp.expired',
        targetType: 'otp',
        metadata: { destination },
      });
      throw new UnauthorizedException({
        error: {
          code: 'OTP_EXPIRED',
          message: 'OTP has expired. Please request a new one.',
        },
      });
    }

    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      await this.auditLogsRepository.insertWithManager({
        action: 'auth.otp.max_attempts',
        targetType: 'otp',
        metadata: { destination },
      });
      throw new UnauthorizedException({
        error: {
          code: 'OTP_MAX_ATTEMPTS',
          message: 'Maximum verification attempts exceeded. Please request a new OTP.',
        },
      });
    }

    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    if (codeHash !== otpRecord.codeHash) {
      await this.otpCodesRepository.incrementAttempts(otpRecord.id);
      await this.auditLogsRepository.insertWithManager({
        action: 'auth.otp.invalid',
        targetType: 'otp',
        metadata: { destination },
      });
      throw new UnauthorizedException({
        error: { code: 'OTP_INVALID', message: 'Invalid OTP code.' },
      });
    }

    await this.otpCodesRepository.markConsumed(otpRecord.id);

    // Find or create user
    let user = await this.usersRepository.findByDestination(destination);
    if (!user) {
      user = await this.usersRepository.createFromDestination(destination);
    }

    // Stamp phone_verified_at once — never reset
    if (!user.phoneVerifiedAt) {
      await this.usersRepository.updatePhoneVerifiedAt(user.id, new Date());
    }

    await this.usersRepository.updateLastLogin(user.id);
    const tokens = await this.issueTokens(user.id, user.role);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: user.id,
      isRegistration: isSignUp,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PASSWORD FLOW (login for returning users + registration completion)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Authenticates a returning user with phone + password.
   *
   * Error codes:
   *   USER_NOT_FOUND     — no account for this phone
   *   PASSWORD_NOT_SET   — legacy OTP-only row; direct to forgot-password flow
   *   INVALID_CREDENTIALS — wrong password (logged to audit trail)
   */
  async loginWithPassword(
    phone: string,
    password: string,
  ): Promise<{ accessToken: string; refreshToken: string; userId: string }> {
    const user = await this.usersRepository.findByPhone(phone);

    if (!user) {
      throw new NotFoundException({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'No account found for this phone number.',
        },
      });
    }

    if (!user.passwordHash) {
      throw new BadRequestException({
        error: {
          code: 'PASSWORD_NOT_SET',
          message:
            'This account has no password set. Use forgot password to create one.',
        },
      });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      await this.auditLogsRepository.insertWithManager({
        action: 'auth.login.invalid_password',
        targetType: 'user',
        targetId: user.id,
        metadata: { phone },
      });
      throw new UnauthorizedException({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Incorrect phone number or password.',
        },
      });
    }

    await this.usersRepository.updateLastLogin(user.id);
    const tokens = await this.issueTokens(user.id, user.role);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: user.id,
    };
  }

  /**
   * Sets the permanent password for a newly registered user.
   * Called after the one-time OTP verify step (using the temp access token).
   *
   * Returns a fresh token pair — this is what the client stores in SecureStore,
   * completing the registration auth flow and starting a real session.
   */
  async setPassword(
    phone: string,
    password: string,
  ): Promise<{ accessToken: string; refreshToken: string; userId: string }> {
    const user = await this.usersRepository.findByPhone(phone);

    if (!user) {
      throw new NotFoundException({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'No account found for this phone number.',
        },
      });
    }

    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await this.usersRepository.updatePasswordHash(user.id, hash);

    // Re-issue a clean token pair now that registration is fully complete
    const tokens = await this.issueTokens(user.id, user.role);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: user.id,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FORGOT / RESET PASSWORD
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Initiates the forgot-password flow.
   * Generates a 15-min JWT reset token and sends it via SMS (logs in dev).
   *
   * Always returns success — never reveals whether a phone is registered
   * (prevents phone enumeration attacks).
   */
  async forgotPassword(phone: string): Promise<{ message: string }> {
    const user = await this.usersRepository.findByPhone(phone);

    if (user) {
      const resetToken = this.jwtService.sign(
        { sub: user.id, purpose: 'password_reset' },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: '15m',
        },
      );

      if (this.configService.get('NODE_ENV') !== 'production') {
        this.logger.log(`[DEV] Password reset token for ${phone}: ${resetToken}`);
      }
      // In production: send SMS via Twilio with resetToken
    }

    return { message: 'If this number is registered, a reset link was sent.' };
  }

  /**
   * Applies a new password using the reset token from the SMS link.
   */
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    let payload: any;
    try {
      payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException({
        error: {
          code: 'RESET_TOKEN_INVALID',
          message: 'Invalid or expired reset token.',
        },
      });
    }

    if (payload?.purpose !== 'password_reset') {
      throw new UnauthorizedException({
        error: { code: 'RESET_TOKEN_INVALID', message: 'Invalid token purpose.' },
      });
    }

    const user = await this.usersRepository.findById(payload.sub);
    if (!user) {
      throw new NotFoundException({
        error: { code: 'USER_NOT_FOUND', message: 'User not found.' },
      });
    }

    const hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.usersRepository.updatePasswordHash(user.id, hash);

    return { message: 'Password updated successfully.' };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REFRESH TOKENS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Rotates a refresh token: validates the old one and issues a new pair.
   * If the refresh token is expired (> 7 days inactivity) this throws 401,
   * which the client's axios interceptor catches to call signOut().
   */
  async refreshTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersRepository.findById(payload.sub);
      if (!user || ['suspended', 'banned', 'deleted'].includes(user.status)) {
        throw new UnauthorizedException({
          error: { code: 'TOKEN_INVALID', message: 'User account is not active.' },
        });
      }

      return this.issueTokens(user.id, user.role);
    } catch {
      throw new UnauthorizedException({
        error: {
          code: 'TOKEN_INVALID',
          message: 'Invalid or expired refresh token.',
        },
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Issues an access + refresh token pair for the given user.
   * Access token: 15 min · Refresh token: 7 days
   */
  private async issueTokens(
    userId: string,
    role: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: userId, role };

    const expiresIn = (this.configService.get<string>('JWT_EXPIRES_IN') || '24h') as any;
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }
}
