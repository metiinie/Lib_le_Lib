import { IsUUID, IsOptional, IsString, IsNumber, IsArray } from 'class-validator';

export class SubmitResponseDto {
  @IsUUID()
  questionId: string;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  optionIds?: string[];

  @IsOptional()
  @IsString()
  responseText?: string;

  @IsOptional()
  @IsNumber()
  responseNumeric?: number;
}
