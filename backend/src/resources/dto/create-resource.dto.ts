import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { ResourceCategory, LanguageCode } from '../entities/resource.entity';

export class CreateResourceDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsEnum(ResourceCategory)
  category: ResourceCategory;

  @IsEnum(LanguageCode)
  @IsOptional()
  language?: LanguageCode;

  @IsBoolean()
  @IsOptional()
  published?: boolean;
}
