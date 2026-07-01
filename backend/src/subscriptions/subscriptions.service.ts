import { Injectable, Logger } from '@nestjs/common';
import { SubscriptionsRepository } from './repositories/subscriptions.repository';
import {
  SubscriptionPlan,
  SubscriptionStatus,
} from './entities/subscription.entity';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly subscriptionRepository: SubscriptionsRepository,
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
}
