import { IsString, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import {
  SubscriptionPlan,
  SubscriptionStatus,
} from '../entities/subscription.entity';

export class WebhookPayloadDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;

  @IsString()
  @IsOptional()
  externalSubscriptionId?: string;

  @IsEnum(SubscriptionPlan)
  @IsOptional()
  plan?: SubscriptionPlan;
}
