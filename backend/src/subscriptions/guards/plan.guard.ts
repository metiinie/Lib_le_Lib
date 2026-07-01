import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { SubscriptionsRepository } from '../repositories/subscriptions.repository';

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(
    private readonly subscriptionRepository: SubscriptionsRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false; // Authentication should be handled by JwtAuthGuard before this
    }

    const hasPremium =
      await this.subscriptionRepository.hasActivePremiumSubscription(user.id);

    if (!hasPremium) {
      throw new ForbiddenException({
        error: {
          code: 'PREMIUM_REQUIRED',
          message: 'This action requires an active premium subscription',
        },
      });
    }

    return true;
  }
}
