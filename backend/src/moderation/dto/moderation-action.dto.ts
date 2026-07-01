import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ModerationActionType } from '../entities/moderation-action.entity';

export class ModerationActionDto {
  @ApiProperty({
    enum: ModerationActionType,
    description: 'The action to take against the reported user',
  })
  @IsEnum(ModerationActionType)
  @IsNotEmpty()
  action: ModerationActionType;

  @ApiProperty({
    description: 'Reason for the moderation action, if any',
    required: false,
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
