import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SwipesRepository } from './repositories/swipes.repository';
import { MatchesRepository } from './repositories/matches.repository';
import { BlocksRepository } from '../safety/repositories/blocks.repository';
import { SwipeDto } from './dto/swipe.dto';
import { Match } from './entities/match.entity';

@Injectable()
export class MatchesService {
  private readonly logger = new Logger(MatchesService.name);

  constructor(
    private readonly swipesRepo: SwipesRepository,
    private readonly matchesRepo: MatchesRepository,
    private readonly blocksRepo: BlocksRepository,
    private readonly dataSource: DataSource,
  ) {}

  async processSwipe(actorId: string, dto: SwipeDto) {
    // 1. Insert the swipe
    await this.swipesRepo.insertSwipe(actorId, dto.targetId, dto.action);

    // 2. Check if this resulted in a mutual match
    if (dto.action === 'like') {
      const isMatch = await this.swipesRepo.hasReciprocalLike(actorId, dto.targetId);
      if (isMatch) {
        return { matched: true };
      }
    }
    return { matched: false };
  }

  async getMatches(userId: string) {
    const excludedIds = await this.blocksRepo.getExcludedUserIds(userId);
    return this.matchesRepo.getActiveMatchesWithProfileData(userId, excludedIds);
  }
}
