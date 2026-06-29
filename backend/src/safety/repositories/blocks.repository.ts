import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Block } from '../entities/block.entity';

@Injectable()
export class BlocksRepository {
  private readonly repo: Repository<Block>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(Block);
  }

  /**
   * Returns an array of user IDs that are blocked by the given user,
   * OR who have blocked the given user.
   */
  async getExcludedUserIds(userId: string): Promise<string[]> {
    const blocks = await this.repo.find({
      where: [
        { blockerId: userId },
        { blockedId: userId },
      ],
    });

    const excludedIds = new Set<string>();
    for (const block of blocks) {
      if (block.blockerId === userId) {
        excludedIds.add(block.blockedId);
      } else {
        excludedIds.add(block.blockerId);
      }
    }
    return Array.from(excludedIds);
  }

  // To be expanded in Phase 6 for POST /blocks and DELETE /blocks/:id
}
