import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
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

  /**
   * Validates that a match exists, is active, and the user belongs to it.
   * Shared across services that operate on matches (messages, video-calls).
   */
  async validateMatchMembership(
    matchId: string,
    userId: string,
  ): Promise<Match> {
    const match = await this.matchesRepo.findById(matchId);

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.status !== 'active') {
      throw new ForbiddenException('Match is no longer active');
    }

    if (match.userAId !== userId && match.userBId !== userId) {
      throw new ForbiddenException('You are not part of this match');
    }

    return match;
  }

  async processSwipe(actorId: string, dto: SwipeDto) {
    // 1. Insert the swipe
    await this.swipesRepo.insertSwipe(actorId, dto.targetId, dto.action);

    // 2. Check if this resulted in a mutual match
    if (dto.action === 'like') {
      const isMatch = await this.swipesRepo.hasReciprocalLike(
        actorId,
        dto.targetId,
      );
      if (isMatch) {
        return { matched: true };
      }
    }
    return { matched: false };
  }

  async getMatches(userId: string) {
    const excludedIds = await this.blocksRepo.getExcludedUserIds(userId);
    return this.matchesRepo.getActiveMatchesWithProfileData(
      userId,
      excludedIds,
    );
  }

  /**
   * Returns profiles of users who liked the current user.
   * Excludes blocked users and already-matched users to avoid showing
   * profiles the user has already interacted with.
   * Photos are returned blurred for privacy.
   */
  async getReceivedLikes(userId: string) {
    const [blockedIds, matchedIds, swipedIds] = await Promise.all([
      this.blocksRepo.getExcludedUserIds(userId),
      this.matchesRepo.getMatchedUserIds(userId),
      this.swipesRepo.getSwipedUserIds(userId),
    ]);

    const excludedIds = [
      ...new Set([...blockedIds, ...matchedIds, ...swipedIds]),
    ];

    const rawLikes = await this.swipesRepo.getReceivedLikes(
      userId,
      excludedIds,
    );

    // Shape the response to match frontend expectations
    return rawLikes.map((row) => ({
      id: row.id,
      nickname: row.nickname || 'Member',
      age: row.age ?? 25,
      region: row.region || 'Nearby',
      photos: [
        {
          id: `ph_${row.id}`,
          blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
          url: row.primaryPhotoRef || undefined,
          revealGranted: false, // Force blurred for received likes
        },
      ],
    }));
  }

  /**
   * Returns profiles of users the current user has liked.
   * Excludes blocked users and already-matched users.
   */
  async getSentLikes(userId: string) {
    const [blockedIds, matchedIds] = await Promise.all([
      this.blocksRepo.getExcludedUserIds(userId),
      this.matchesRepo.getMatchedUserIds(userId),
    ]);

    const excludedIds = [...new Set([...blockedIds, ...matchedIds])];

    const rawLikes = await this.swipesRepo.getSentLikes(
      userId,
      excludedIds,
    );

    // Shape the response to match frontend expectations
    return rawLikes.map((row) => ({
      id: row.id,
      nickname: row.nickname || 'Member',
      age: row.age ?? 25,
      region: row.region || 'Nearby',
      photos: [
        {
          id: `ph_${row.id}`,
          blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
          url: row.primaryPhotoRef || undefined,
          revealGranted: row.isBlurred === false,
        },
      ],
    }));
  }
}
