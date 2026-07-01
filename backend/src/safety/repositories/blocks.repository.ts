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
      where: [{ blockerId: userId }, { blockedId: userId }],
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

  /**
   * Inserts a block from blockerId to blockedId.
   */
  async insertBlock(blockerId: string, blockedId: string): Promise<Block> {
    const block = this.repo.create({ blockerId, blockedId });
    return this.repo.save(block);
  }

  /**
   * Deletes a block by ID, ensuring the blocker is the one making the request.
   */
  async deleteBlock(blockerId: string, blockId: string): Promise<boolean> {
    const result = await this.repo.delete({ id: blockId, blockerId });
    return (
      result.affected !== null &&
      result.affected !== undefined &&
      result.affected > 0
    );
  }

  /**
   * Checks if there's any blocking relationship (either direction) between two users.
   */
  async isBlocked(userA: string, userB: string): Promise<boolean> {
    const count = await this.repo.count({
      where: [
        { blockerId: userA, blockedId: userB },
        { blockerId: userB, blockedId: userA },
      ],
    });
    return count > 0;
  }
}
