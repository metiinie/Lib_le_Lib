import { IsOptional, IsInt, Min, Max, IsUUID, IsString, IsArray, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class DiscoveryFiltersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(18)
  minAge?: number = 18;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Max(100)
  maxAge?: number = 100;

  @IsOptional()
  @IsString() // 'man', 'woman', 'other'
  gender?: string;

  @IsOptional()
  @IsUUID()
  regionId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relationshipGoals?: string[];
}
