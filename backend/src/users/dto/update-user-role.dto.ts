import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRoleDto {
  @ApiProperty({
    enum: ['verification_officer', 'moderator', 'health_professional', 'admin'],
    description: 'Target staff role to assign to the user.',
  })
  @IsEnum([
    'verification_officer',
    'moderator',
    'health_professional',
    'admin',
  ])
  role: 'verification_officer' | 'moderator' | 'health_professional' | 'admin';
}
