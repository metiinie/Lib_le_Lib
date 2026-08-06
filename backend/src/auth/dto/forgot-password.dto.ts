import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for `POST /auth/password/forgot`.
 * Triggers an SMS reset link to the registered phone number.
 */
export class ForgotPasswordDto {
  @ApiProperty({
    description: 'The registered phone number to send the reset link to.',
    example: '+251911000000',
  })
  @IsNotEmpty()
  @IsString()
  phone: string;
}
