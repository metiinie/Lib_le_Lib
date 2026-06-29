import {
  IsString,
  IsDateString,
  IsEnum,
  IsUUID,
  IsOptional,
  IsArray,
  IsBoolean,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProfileDto {
  @ApiProperty({ example: 'Alex' })
  @IsString()
  @MinLength(2)
  nickname: string;

  @ApiProperty({ example: '1995-10-15' })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ enum: ['man', 'woman', 'other'] })
  @IsEnum(['man', 'woman', 'other'])
  gender: string;

  @ApiProperty({ description: 'UUID of the region' })
  @IsUUID()
  @IsOptional()
  regionId?: string;

  @ApiProperty({ enum: ['marriage', 'serious_relationship', 'friendship'], isArray: true })
  @IsArray()
  @IsEnum(['marriage', 'serious_relationship', 'friendship'], { each: true })
  relationshipGoals: string[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  discreetMode?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  lowBandwidthMode?: boolean;

  @ApiProperty({ enum: ['am', 'en'], required: false })
  @IsEnum(['am', 'en'])
  @IsOptional()
  preferredLanguage?: string;

  @ApiProperty({ type: [String], description: 'Array of InterestTag UUIDs', required: false })
  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  interestTagIds?: string[];
}
