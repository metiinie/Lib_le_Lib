import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for `POST /auth/refresh`.
 * Accepts the refresh token to rotate.
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'The refresh token issued at login.',
  })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
