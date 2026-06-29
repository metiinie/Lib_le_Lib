import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MatchesService } from './matches.service';
import { SwipeDto } from './dto/swipe.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post('swipes')
  @HttpCode(HttpStatus.CREATED)
  async swipe(
    @CurrentUser() user: any,
    @Body() dto: SwipeDto,
  ) {
    return this.matchesService.processSwipe(user.id, dto);
  }

  @Get('matches')
  async getMatches(@CurrentUser() user: any) {
    return this.matchesService.getMatches(user.id);
  }
}
