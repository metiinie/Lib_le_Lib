import { IsIn, IsString, ValidateIf, IsOptional } from 'class-validator';

export class DecideVerificationDto {
  @IsIn(['approved', 'rejected'])
  decision: 'approved' | 'rejected';

  @ValidateIf((o) => o.decision === 'rejected')
  @IsString()
  rejectionReason?: string;
}
