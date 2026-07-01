import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { MatchesService } from './matches.service';
import { SwipeDto } from './dto/swipe.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('matches')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
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
}
