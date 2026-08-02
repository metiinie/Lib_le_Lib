import { Injectable, ConflictException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Swipe } from '../entities/swipe.entity';

@Injectable()
export class SwipesRepository {
  private readonly repo: Repository<Swipe>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(Swipe);
  }

  async insertSwipe(
    actorId: string,
    targetId: string,
    action: string,
  ): Promise<Swipe> {
    try {
      const swipe = this.repo.create({ actorId, targetId, action });
      return await this.repo.save(swipe);
    } catch (error: any) {
      if (error.code === '23505') {
        // Postgres unique violation (actor_id, target_id)
        throw new ConflictException({
          error: {
            code: 'ALREADY_SWIPED',
            message: 'You have already swiped on this user.',
          },
        });
      }
      throw error;
    }
  }

  async getSwipedUserIds(actorId: string): Promise<string[]> {
    const swipes = await this.repo.find({
      where: { actorId },
      select: ['targetId'],
    });
    return swipes.map((s) => s.targetId);
  }

  async hasReciprocalLike(actorId: string, targetId: string): Promise<boolean> {
    const count = await this.repo.count({
      where: {
        actorId: targetId,
        targetId: actorId,
        action: 'like',
      },
    });
    return count > 0;
  }

  /**
   * Returns profiles of users who liked the given user.
   * Excludes blocked users and already-matched users.
   */
  async getReceivedLikes(
    userId: string,
    excludedIds: string[],
  ): Promise<any[]> {
    const qb = this.dataSource
      .createQueryBuilder()
      .select([
        's.actor_id as "id"',
        'p.nickname as "nickname"',
        `EXTRACT(YEAR FROM AGE(NOW(), p.date_of_birth))::int as "age"`,
        'r.name as "region"',
        'ph.storage_ref as "primaryPhotoRef"',
        'ph.blurred_default as "isBlurred"',
        's.created_at as "likedAt"',
      ])
      .from('swipes', 's')
      .innerJoin('profiles', 'p', 'p.user_id = s.actor_id')
      .leftJoin('regions', 'r', 'r.id = p.region_id')
      .leftJoin(
        'photos',
        'ph',
        'ph.profile_id = s.actor_id AND ph.is_primary = true',
      )
      .where('s.target_id = :userId', { userId })
      .andWhere('s.action = :action', { action: 'like' });

    if (excludedIds.length > 0) {
      qb.andWhere('s.actor_id NOT IN (:...excludedIds)', { excludedIds });
    }

    qb.orderBy('s.created_at', 'DESC');

    return qb.getRawMany();
  }

  /**
   * Returns profiles of users that the given user has liked.
   * Excludes blocked users and already-matched users.
   */
  async getSentLikes(
    userId: string,
    excludedIds: string[],
  ): Promise<any[]> {
    const qb = this.dataSource
      .createQueryBuilder()
      .select([
        's.target_id as "id"',
        'p.nickname as "nickname"',
        `EXTRACT(YEAR FROM AGE(NOW(), p.date_of_birth))::int as "age"`,
        'r.name as "region"',
        'ph.storage_ref as "primaryPhotoRef"',
        'ph.blurred_default as "isBlurred"',
        's.created_at as "likedAt"',
      ])
      .from('swipes', 's')
      .innerJoin('profiles', 'p', 'p.user_id = s.target_id')
      .leftJoin('regions', 'r', 'r.id = p.region_id')
      .leftJoin(
        'photos',
        'ph',
        'ph.profile_id = s.target_id AND ph.is_primary = true',
      )
      .where('s.actor_id = :userId', { userId })
      .andWhere('s.action = :action', { action: 'like' });

    if (excludedIds.length > 0) {
      qb.andWhere('s.target_id NOT IN (:...excludedIds)', { excludedIds });
    }

    qb.orderBy('s.created_at', 'DESC');

    return qb.getRawMany();
  }
}
