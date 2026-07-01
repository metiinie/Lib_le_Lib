import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { Subscription } from './entities/subscription.entity';
import { PlanGuard } from './guards/plan.guard';

import { SubscriptionsRepository } from './repositories/subscriptions.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription])],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, PlanGuard, SubscriptionsRepository],
  exports: [TypeOrmModule, PlanGuard, SubscriptionsRepository],
})
export class SubscriptionsModule {}
