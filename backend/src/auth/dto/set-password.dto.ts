import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for `POST /auth/password/set`.
 * Called once after OTP verify during registration to set the permanent password.
 */
export class SetPasswordDto {
  @ApiProperty({
    description: 'The verified phone number this password is for.',
    example: '+251911000000',
  })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({
    description:
      'New password. Min 8 chars, at least 1 number and 1 symbol.',
    example: 'MyP@ssw0rd',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters.' })
  @Matches(/(?=.*[0-9])/, { message: 'Password must contain at least one number.' })
  @Matches(/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/, {
    message: 'Password must contain at least one symbol.',
  })
  password: string;
}
