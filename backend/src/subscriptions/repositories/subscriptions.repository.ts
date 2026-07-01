import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import {
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from '../entities/subscription.entity';

@Injectable()
export class SubscriptionsRepository {
  private readonly repo: Repository<Subscription>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(Subscription);
  }

  async findByUserId(userId: string): Promise<Subscription | null> {
    return this.repo.findOne({ where: { userId } });
  }

  createSubscription(data: Partial<Subscription>): Subscription {
    return this.repo.create(data);
  }

  async saveSubscription(subscription: Subscription): Promise<Subscription> {
    return this.repo.save(subscription);
  }

  async hasActivePremiumSubscription(userId: string): Promise<boolean> {
    const subscription = await this.repo.findOne({
      where: {
        userId,
        plan: SubscriptionPlan.PREMIUM,
        status: SubscriptionStatus.ACTIVE,
      },
      order: { startedAt: 'DESC' },
    });
    return !!subscription;
  }
}
