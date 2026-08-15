import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LoginDto } from './dto/login.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SsoAuthDto } from './dto/sso-auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  // ─────────────────────────────────────────────────────────────────────────
  // OTP ENDPOINTS (registration phone verification — one-time use)
  // ─────────────────────────────────────────────────────────────────────────

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request an OTP to verify a phone number during registration.' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully.' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded.' })
  async requestOtp(@Body() requestOtpDto: RequestOtpDto) {
    return this.authService.requestOtp(
      requestOtpDto.destination,
      requestOtpDto.isSignUp,
    );
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify the OTP code. Returns a temp token pair for use in POST /auth/password/set.' })
  @ApiResponse({ status: 200, description: 'OTP verified. Returns temp accessToken + refreshToken.' })
  @ApiResponse({ status: 401, description: 'Invalid, expired, or max-attempt OTP.' })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(
      verifyOtpDto.destination,
      verifyOtpDto.code,
      verifyOtpDto.isSignUp,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PASSWORD LOGIN (returning users)
  // ─────────────────────────────────────────────────────────────────────────

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with phone + password. Returns accessToken + refreshToken.' })
  @ApiResponse({ status: 200, description: 'Login successful.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.loginWithPassword(
      loginDto.phone,
      loginDto.password,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // APPLE & GOOGLE SINGLE SIGN-ON (SSO)
  // ─────────────────────────────────────────────────────────────────────────

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('sso/apple')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login or register with Apple Sign-In ID Token. Returns accessToken + refreshToken + requiresPhoneVerification flag.' })
  @ApiResponse({ status: 200, description: 'Apple SSO authentication successful.' })
  @ApiResponse({ status: 401, description: 'Invalid Apple ID Token.' })
  async ssoApple(@Body() ssoDto: SsoAuthDto) {
    return this.authService.loginWithApple(ssoDto);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('sso/google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login or register with Google Sign-In ID Token. Returns accessToken + refreshToken + requiresPhoneVerification flag.' })
  @ApiResponse({ status: 200, description: 'Google SSO authentication successful.' })
  @ApiResponse({ status: 401, description: 'Invalid Google ID Token.' })
  async ssoGoogle(@Body() ssoDto: SsoAuthDto) {
    return this.authService.loginWithGoogle(ssoDto);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PASSWORD MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────

  @Post('password/set')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Set password after OTP verify during registration. ' +
      'Requires the temp accessToken from POST /auth/otp/verify in the Authorization header. ' +
      'Returns a fresh token pair to store in SecureStore.',
  })
  @ApiResponse({ status: 200, description: 'Password set. Returns final accessToken + refreshToken.' })
  async setPassword(@Body() setPasswordDto: SetPasswordDto) {
    return this.authService.setPassword(
      setPasswordDto.phone,
      setPasswordDto.password,
    );
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('password/forgot')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request a password reset SMS to the registered phone number.',
  })
  @ApiResponse({ status: 200, description: 'Reset link sent (if phone is registered).' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.phone);
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apply a new password using the reset token from the SMS link.' })
  @ApiResponse({ status: 200, description: 'Password reset successfully.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired reset token.' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TOKEN REFRESH
  // ─────────────────────────────────────────────────────────────────────────

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate the refresh token for new access/refresh tokens.' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token.' })
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }
}
