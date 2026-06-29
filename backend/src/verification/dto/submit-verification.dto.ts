import { IsString, IsOptional } from 'class-validator';

export class SubmitVerificationDto {
  @IsString()
  documentType: string;

  @IsOptional()
  @IsString()
  contentType?: string;
}
