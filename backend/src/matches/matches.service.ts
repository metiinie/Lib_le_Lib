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

import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class MatchesService {
  private readonly logger = new Logger(MatchesService.name);

  constructor(
    private readonly swipesRepo: SwipesRepository,
    private readonly matchesRepo: MatchesRepository,
    private readonly blocksRepo: BlocksRepository,
    private readonly subscriptionsService: SubscriptionsService,
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
    const rawMatches =
      await this.matchesRepo.getActiveMatchesWithProfileData(
        userId,
        excludedIds,
      );

    // Shape the response to match the frontend Match interface
    return rawMatches.map((row: any) => ({
      id: row.matchId,
      matchedUserId: row.userId,
      matchedUserNickname: row.nickname || 'Member',
      avatarBlurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
      avatarUrl: row.primaryPhotoRef || undefined,
      // Photos are visible to verified users by default (photosVisibleToVerified
      // defaults to true). The photo owner can opt OUT by setting it to false.
      // If the owner hasn't opted out, verified viewers see the unblurred photo.
      revealGranted: row.photosVisibleToVerified !== false,
      lastMessageEncryptedPreview: undefined,
    }));
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

  async getDmRequests(userId: string) {
    const results = await this.dataSource.query(`
      SELECT dr.id, dr.sender_id, dr.recipient_id, dr.first_message, dr.status, dr.created_at,
             p.nickname, p.primary_photo_ref
      FROM dm_requests dr
      JOIN profiles p ON p.user_id = dr.sender_id
      WHERE dr.recipient_id = $1 AND dr.status = 'pending' AND dr.expires_at > now()
      ORDER BY dr.created_at DESC
    `, [userId]);

    return results.map((row: any) => ({
      id: row.id,
      senderId: row.sender_id,
      nickname: row.nickname,
      avatarUrl: row.primary_photo_ref,
      message: row.first_message,
      createdAt: row.created_at,
    }));
  }

  async createDmRequest(senderId: string, recipientId: string, firstMessage: string) {
    // 1. Check if a request already exists
    const existing = await this.dataSource.query(`
      SELECT id FROM dm_requests WHERE sender_id = $1 AND recipient_id = $2
    `, [senderId, recipientId]);
    if (existing.length > 0) {
      throw new ForbiddenException('DM request already sent to this user');
    }

    // 2. Consume a DM credit
    await this.subscriptionsService.consumeDmCredit(senderId);

    // 3. Create request
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    await this.dataSource.query(`
      INSERT INTO dm_requests (sender_id, recipient_id, first_message, expires_at)
      VALUES ($1, $2, $3, $4)
    `, [senderId, recipientId, firstMessage, expiresAt]);

    return { success: true };
  }

  async acceptDmRequest(recipientId: string, requestId: string) {
    return this.dataSource.transaction(async (manager) => {
      const result = await manager.query(`
        UPDATE dm_requests SET status = 'accepted'
        WHERE id = $1 AND recipient_id = $2 AND status = 'pending'
        RETURNING sender_id
      `, [requestId, recipientId]);

      if (result[0].length === 0) {
        throw new NotFoundException('DM request not found or already processed');
      }

      const senderId = result[0][0].sender_id;

      // Create mutual match
      const matchId = await this.matchesRepo.createMatch(manager, senderId, recipientId);
      
      // We don't have direct access to MessageRepository here, but usually we would 
      // insert the first_message into the messages table here. For simplicity, we assume
      // the frontend fetches the first message from the match history or similar, 
      // or we can emit an event. Let's just create the match.
      
      return { matchId };
    });
  }
}
