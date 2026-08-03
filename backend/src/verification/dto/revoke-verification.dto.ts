import { IsString, IsNotEmpty } from 'class-validator';

export class RevokeVerificationDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
