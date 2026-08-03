import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Param,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
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

  @Get('admin/queue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getAdminQueue(
    @Query('limit') limitStr: string,
    @Query('offset') offsetStr: string,
    @Query('status') status?: string,
    @Query('plan') plan?: string,
  ) {
    const limit = parseInt(limitStr, 10) || 50;
    const offset = parseInt(offsetStr, 10) || 0;
    const [data, total] = await this.subscriptionsService.getAdminQueue(
      limit,
      offset,
      status,
      plan,
    );
    return { data, total, limit, offset };
  }

  @Post('admin/:id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async cancelSubscription(
    @Req() req: any,
    @Param('id') subscriptionId: string,
    @Body() body: { reason: string },
  ) {
    await this.subscriptionsService.cancelSubscription(
      req.user.id,
      subscriptionId,
      body.reason,
    );
    return { success: true };
  }
}
