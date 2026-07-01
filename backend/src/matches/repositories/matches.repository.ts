import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Match } from '../entities/match.entity';

@Injectable()
export class MatchesRepository {
  private readonly repo: Repository<Match>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(Match);
  }

  async findById(id: string): Promise<Match | null> {
    return this.repo.findOne({ where: { id } });
  }

  /**
   * Returns all active matches for the user.
   */
  async findActiveMatches(userId: string): Promise<Match[]> {
    return this.repo.find({
      where: [
        { userAId: userId, status: 'active' },
        { userBId: userId, status: 'active' },
      ],
      order: { matchedAt: 'DESC' },
    });
  }

  /**
   * Helper for Discovery to exclude already matched users
   */
  async getMatchedUserIds(userId: string): Promise<string[]> {
    const matches = await this.repo.find({
      where: [{ userAId: userId }, { userBId: userId }],
    });

    const excludedIds = new Set<string>();
    for (const match of matches) {
      if (match.userAId === userId) {
        excludedIds.add(match.userBId);
      } else {
        excludedIds.add(match.userAId);
      }
    }
    return Array.from(excludedIds);
  }

  /**
   * Fetches active matches and joins profile/photo data in a single query
   */
  async getActiveMatchesWithProfileData(
    userId: string,
    excludedIds: string[],
  ): Promise<any[]> {
    const qb = this.dataSource
      .createQueryBuilder()
      .select([
        'm.id as "matchId"',
        'm.matched_at as "matchedAt"',
        'p.user_id as "userId"',
        'p.nickname as "nickname"',
        'p.date_of_birth as "dateOfBirth"',
        'ph.storage_ref as "primaryPhotoRef"',
        'ph.blurred_default as "isBlurred"',
      ])
      .from('matches', 'm')
      // Join profiles on the OTHER user
      .innerJoin(
        'profiles',
        'p',
        'p.user_id = CASE WHEN m.user_a_id = :userId THEN m.user_b_id ELSE m.user_a_id END',
        { userId },
      )
      // Left join photos for the primary photo of the other user
      .leftJoin(
        'photos',
        'ph',
        'ph.profile_id = p.user_id AND ph.is_primary = true',
      )
      .where('m.status = :status', { status: 'active' })
      .andWhere('(m.user_a_id = :userId OR m.user_b_id = :userId)', { userId });

    if (excludedIds.length > 0) {
      qb.andWhere('p.user_id NOT IN (:...excludedIds)', { excludedIds });
    }

    qb.orderBy('m.matched_at', 'DESC');

    return qb.getRawMany();
  }
}
