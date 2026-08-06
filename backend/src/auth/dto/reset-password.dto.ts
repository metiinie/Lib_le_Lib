import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for `POST /auth/password/reset`.
 * Applies a new password using the reset token from the SMS link.
 */
export class ResetPasswordDto {
  @ApiProperty({
    description: 'The password reset token received via SMS.',
  })
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty({
    description:
      'New password. Min 8 chars, at least 1 number and 1 symbol.',
    example: 'MyNewP@ss1',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters.' })
  @Matches(/(?=.*[0-9])/, { message: 'Password must contain at least one number.' })
  @Matches(/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/, {
    message: 'Password must contain at least one symbol.',
  })
  newPassword: string;
}
