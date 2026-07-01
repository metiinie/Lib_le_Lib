import { IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ScheduleVideoCallDto {
  @ApiProperty({
    description: 'Scheduled time for the video call',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
