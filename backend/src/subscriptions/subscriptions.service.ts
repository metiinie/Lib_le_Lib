import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuditLogsService } from '../moderation/audit-logs.service';
import { SubscriptionsRepository } from './repositories/subscriptions.repository';
import {
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from './entities/subscription.entity';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly subscriptionRepository: SubscriptionsRepository,
    private readonly dataSource: DataSource,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async handleWebhook(provider: string, payload: any): Promise<void> {
    // Basic MVP simulation for telebirr, cbe, chapa webhooks
    this.logger.log(`Received webhook from ${provider}`);

    // In a real implementation, we would extract the userId, status, plan, etc. from payload
    // and verify the signature.

    const { userId, status, externalSubscriptionId, plan } = payload;

    if (!userId) {
      this.logger.warn('Webhook payload missing userId');
      return;
    }

    let subscription = await this.subscriptionRepository.findByUserId(userId);

    if (!subscription) {
      subscription = this.subscriptionRepository.createSubscription({
        userId,
        plan: plan || SubscriptionPlan.PREMIUM,
        paymentProvider: provider,
        externalSubscriptionId,
      });
    }

    subscription.status = status || SubscriptionStatus.ACTIVE;
    subscription.externalSubscriptionId =
      externalSubscriptionId || subscription.externalSubscriptionId;

    await this.subscriptionRepository.saveSubscription(subscription);
  }

  async getAdminQueue(
    limit: number,
    offset: number,
    status?: string,
    plan?: string,
  ) {
    const [data, total] = await this.subscriptionRepository.findAdminQueue(
      limit,
      offset,
      status,
      plan,
    );

    const mappedData = data.map((sub) => {
      const { user, ...rest } = sub;
      return {
        ...rest,
        user: user
          ? {
              id: user.id,
              email: user.email,
              phone: user.phone,
              profile: user.profile
                ? {
                    nickname: user.profile.nickname,
                  }
                : null,
            }
          : null,
      };
    });

    return [mappedData, total];
  }

  async cancelSubscription(
    adminId: string,
    subscriptionId: string,
    reason: string,
  ): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const subscription = await manager.findOne(Subscription, {
        where: { id: subscriptionId },
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      subscription.status = SubscriptionStatus.CANCELED;
      await manager.save(subscription);

      await this.auditLogsService.logAction(manager, {
        actorId: adminId,
        actorRole: 'admin',
        action: 'subscription_cancelled',
        targetType: 'subscription',
        targetId: subscription.id,
        metadata: { reason, plan: subscription.plan },
      });
    });
  }
}
