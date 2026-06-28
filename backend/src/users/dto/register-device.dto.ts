import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for `POST /devices`.
 * Registers a device's push token and optional E2E public key.
 */
export class RegisterDeviceDto {
  @ApiProperty({
    description: "Device platform: 'ios' or 'android'.",
    example: 'android',
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(['ios', 'android'])
  platform: string;

  @ApiPropertyOptional({
    description: 'FCM/APNs push notification token.',
  })
  @IsOptional()
  @IsString()
  pushToken?: string;

  @ApiPropertyOptional({
    description: 'E2E key-exchange public key for this device.',
  })
  @IsOptional()
  @IsString()
  publicKey?: string;
}
