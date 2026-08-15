import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { MatchesService } from './matches.service';
import { SwipeDto } from './dto/swipe.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActiveMemberGuard } from '../auth/guards/active-member.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('matches')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, ActiveMemberGuard)
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @Post('swipes')
  @HttpCode(HttpStatus.CREATED)
  async swipe(@CurrentUser() user: any, @Body() dto: SwipeDto) {
    return this.matchesService.processSwipe(user.id, dto);
  }

  @Get('matches')
  async getMatches(@CurrentUser() user: any) {
    return this.matchesService.getMatches(user.id);
  }

  @Get('swipes/received-likes')
  async getReceivedLikes(@CurrentUser() user: any) {
    return this.matchesService.getReceivedLikes(user.id);
  }

  @Get('swipes/sent-likes')
  async getSentLikes(@CurrentUser() user: any) {
    return this.matchesService.getSentLikes(user.id);
  }

  @Get('dm-requests')
  async getDmRequests(@CurrentUser() user: any) {
    return this.matchesService.getDmRequests(user.id);
  }

  @Post('dm-requests')
  async createDmRequest(@CurrentUser() user: any, @Body() dto: { recipientId: string; firstMessage: string }) {
    return this.matchesService.createDmRequest(user.id, dto.recipientId, dto.firstMessage);
  }

  @Patch('dm-requests/:id/accept')
  async acceptDmRequest(@CurrentUser() user: any, @Param('id') requestId: string) {
    return this.matchesService.acceptDmRequest(user.id, requestId);
  }
}
