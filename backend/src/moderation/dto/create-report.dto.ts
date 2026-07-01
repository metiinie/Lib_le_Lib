import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReportCategory } from '../entities/report.entity';

export class CreateReportDto {
  @ApiProperty({ description: 'The ID of the user being reported' })
  @IsUUID()
  @IsNotEmpty()
  reportedId: string;

  @ApiProperty({
    description: 'The ID of the match, if the report originates from a match',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  matchId?: string;

  @ApiProperty({
    enum: ReportCategory,
    description: 'The category of the report',
  })
  @IsEnum(ReportCategory)
  @IsNotEmpty()
  category: ReportCategory;

  @ApiProperty({
    description: 'Optional context or description of the incident',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Storage reference to attached evidence',
    required: false,
  })
  @IsString()
  @IsOptional()
  evidenceRef?: string;
}
