import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BlocksRepository } from '../safety/repositories/blocks.repository';
import { SwipesRepository } from '../matches/repositories/swipes.repository';
import { MatchesRepository } from '../matches/repositories/matches.repository';
import { DiscoveryRepository } from './repositories/discovery.repository';
import { DiscoveryFiltersDto } from './dto/discovery-filters.dto';

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);

  constructor(
    private readonly blocksRepo: BlocksRepository,
    private readonly swipesRepo: SwipesRepository,
    private readonly matchesRepo: MatchesRepository,
    private readonly discoveryRepo: DiscoveryRepository,
  ) {}

  async getDiscoveryFeed(userId: string, filters: DiscoveryFiltersDto) {
    // 1. Gather all IDs we MUST exclude (self, blocked, swiped, matched)
    const blockedIds = await this.blocksRepo.getExcludedUserIds(userId);
    const swipedIds = await this.swipesRepo.getSwipedUserIds(userId);
    const matchedIds = await this.matchesRepo.getMatchedUserIds(userId);

    const excludedIds = [...new Set([userId, ...blockedIds, ...swipedIds, ...matchedIds])];

    // 2. Fetch the paged and filtered results using the repository
    return this.discoveryRepo.findDiscoverablePaged(userId, excludedIds, filters);
  }
}
