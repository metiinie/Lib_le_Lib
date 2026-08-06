import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for `POST /auth/login`.
 * Phone + password credentials for returning users.
 */
export class LoginDto {
  @ApiProperty({
    description: 'Registered phone number.',
    example: '+251911000000',
  })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'Account password (min 8 characters).',
    example: 'MyP@ssw0rd',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;
}
