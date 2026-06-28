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
import { OtpCodesRepository } from './repositories/otp-codes.repository';
import { UsersRepository } from '../users/repositories/users.repository';

/** OTP validity window in minutes. */
const OTP_EXPIRY_MINUTES = 5;

/** Max OTP verification attempts before the code is invalidated. */
const MAX_OTP_ATTEMPTS = 5;

/** Max OTP requests per destination per hour (rate-limit). */
const MAX_OTP_REQUESTS_PER_HOUR = 5;

/**
 * Auth service — business logic for OTP-based authentication.
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
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generates and stores an OTP for a phone or email destination.
   *
   * In development, the OTP is logged (but NOT in production — per
   * conventions.md, never log sensitive payloads).
   */
  async requestOtp(destination: string, isSignUp: boolean): Promise<{ message: string }> {
    // Intent check
    const user = await this.usersRepository.findByDestination(destination);
    if (isSignUp && user) {
      throw new ConflictException({
        error: {
          code: 'USER_ALREADY_EXISTS',
          message: 'This destination is already registered.',
        },
      });
    }
    if (!isSignUp && !user) {
      throw new NotFoundException({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'No account found for this destination.',
        },
      });
    }

    // Rate-limit: max N requests per hour per destination
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

    // Generate a 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the code before storing (plaintext never persisted)
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');

    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await this.otpCodesRepository.create({
      destination,
      codeHash,
      expiresAt,
    });

    // In development, log the code so devs can test without a real SMS/email provider.
    // In production, this would dispatch to Twilio/SES via a notification service.
    if (this.configService.get('NODE_ENV') !== 'production') {
      this.logger.log(`[DEV] OTP for ${destination}: ${code}`);
    }

    return { message: 'OTP sent successfully.' };
  }

  /**
   * Verifies an OTP, creates/finds the user, and issues JWT tokens.
   *
   * Per business-rules.md: OTP-only auth for v1, no password flow.
   */
  async verifyOtp(
    destination: string,
    code: string,
    isSignUp: boolean,
  ): Promise<{ accessToken: string; refreshToken: string; userId: string }> {
    // Re-verify intent to prevent race conditions or mismatched flows
    const userExists = await this.usersRepository.findByDestination(destination);
    if (isSignUp && userExists) {
      throw new ConflictException({
        error: {
          code: 'USER_ALREADY_EXISTS',
          message: 'This destination is already registered.',
        },
      });
    }
    if (!isSignUp && !userExists) {
      throw new NotFoundException({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'No account found for this destination.',
        },
      });
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

    // Check expiry
    if (new Date() > otpRecord.expiresAt) {
      throw new UnauthorizedException({
        error: {
          code: 'OTP_EXPIRED',
          message: 'OTP has expired. Please request a new one.',
        },
      });
    }

    // Check attempt limit
    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      throw new UnauthorizedException({
        error: {
          code: 'OTP_MAX_ATTEMPTS',
          message:
            'Maximum verification attempts exceeded. Please request a new OTP.',
        },
      });
    }

    // Verify the code
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    if (codeHash !== otpRecord.codeHash) {
      await this.otpCodesRepository.incrementAttempts(otpRecord.id);
      throw new UnauthorizedException({
        error: {
          code: 'OTP_INVALID',
          message: 'Invalid OTP code.',
        },
      });
    }

    // Mark OTP as consumed
    await this.otpCodesRepository.markConsumed(otpRecord.id);

    // Find or create user
    let user = await this.usersRepository.findByDestination(destination);
    if (!user) {
      user = await this.usersRepository.createFromDestination(destination);
    }

    // Update last login
    await this.usersRepository.updateLastLogin(user.id);

    // Issue tokens
    const tokens = await this.issueTokens(user.id, user.role);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: user.id,
    };
  }

  /**
   * Rotates a refresh token: validates the old one and issues a new pair.
   */
  async refreshTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // Verify user still exists and is not suspended/banned/deleted
      const user = await this.usersRepository.findById(payload.sub);
      if (!user || ['suspended', 'banned', 'deleted'].includes(user.status)) {
        throw new UnauthorizedException({
          error: {
            code: 'TOKEN_INVALID',
            message: 'User account is not active.',
          },
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

  /**
   * Issues an access + refresh token pair.
   */
  private async issueTokens(
    userId: string,
    role: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: userId, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }
}
