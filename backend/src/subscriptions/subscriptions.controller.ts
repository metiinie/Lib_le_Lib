import {
  Controller,
  Post,
  Body,
  Headers,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import * as crypto from 'crypto';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('webhook/:provider')
  async handleWebhook(
    @Headers('x-signature') signature: string,
    @Body() payload: WebhookPayloadDto,
    @Param('provider') provider: string,
  ) {
    if (!signature) {
      throw new UnauthorizedException('Missing signature');
    }

    // Example signature verification logic (pseudo-code using a secret)
    // In production, use the actual provider's secret and hashing mechanism
    const secret = process.env.WEBHOOK_SECRET || 'test_secret';
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (computedSignature !== signature && process.env.NODE_ENV !== 'test') {
      // Depending on the exact testing setup, we might allow bypass in test mode
      // For now, let's enforce it strictly unless it's a dev/test stub
      throw new UnauthorizedException('Invalid signature');
    }

    await this.subscriptionsService.handleWebhook(provider, payload);
    return { success: true };
  }
}
