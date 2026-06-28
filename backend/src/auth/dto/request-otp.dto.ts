import { IsNotEmpty, IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for `POST /auth/otp/request`.
 * Accepts a phone number or email to receive the OTP.
 */
export class RequestOtpDto {
  @ApiProperty({
    description: 'Phone number or email address to send the OTP to.',
    example: '+251911000000',
  })
  @IsNotEmpty()
  @IsString()
  destination: string;

  @ApiProperty({
    description: 'True if this is a signup attempt, false if login.',
    example: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  isSignUp: boolean;
}
