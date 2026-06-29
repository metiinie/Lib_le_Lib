import { Injectable, ConflictException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Swipe } from '../entities/swipe.entity';

@Injectable()
export class SwipesRepository {
  private readonly repo: Repository<Swipe>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(Swipe);
  }

  async insertSwipe(actorId: string, targetId: string, action: string): Promise<Swipe> {
    try {
      const swipe = this.repo.create({ actorId, targetId, action });
      return await this.repo.save(swipe);
    } catch (error) {
      if (error.code === '23505') { // Postgres unique violation (actor_id, target_id)
        throw new ConflictException({
          error: { code: 'ALREADY_SWIPED', message: 'You have already swiped on this user.' },
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
}
