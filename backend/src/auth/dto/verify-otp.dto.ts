import { IsNotEmpty, IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for `POST /auth/otp/verify`.
 * Accepts the destination and the OTP code for verification.
 */
export class VerifyOtpDto {
  @ApiProperty({
    description: 'Phone number or email address the OTP was sent to.',
    example: '+251911000000',
  })
  @IsNotEmpty()
  @IsString()
  destination: string;

  @ApiProperty({
    description: 'The 6-digit OTP code.',
    example: '123456',
  })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({
    description: 'True if this is a signup attempt, false if login.',
    example: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  isSignUp: boolean;
}
