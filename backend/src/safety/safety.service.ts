import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BlocksRepository } from './repositories/blocks.repository';
import { AuditLogsService } from '../moderation/audit-logs.service';
import { Block } from './entities/block.entity';

@Injectable()
export class SafetyService {
  constructor(
    private readonly blocksRepo: BlocksRepository,
    private readonly dataSource: DataSource,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new ConflictException({
        error: {
          code: 'CANNOT_BLOCK_SELF',
          message: 'You cannot block yourself',
        },
      });
    }

    try {
      return await this.dataSource.transaction(async (manager) => {
        // Insert block
        const block = manager.create(Block, { blockerId, blockedId });
        const savedBlock = await manager.save(block);

        // Write audit log
        await this.auditLogsService.logAction(manager, {
          actorId: blockerId,
          actorRole: 'member', // Assumes members do the blocking
          action: 'user_block',
          targetType: 'user',
          targetId: blockedId,
        });

        return savedBlock;
      });
    } catch (err: any) {
      if (err.code === '23505') {
        // Postgres unique_violation
        throw new ConflictException({
          error: {
            code: 'ALREADY_BLOCKED',
            message: 'User is already blocked',
          },
        });
      }
      throw err;
    }
  }

  async unblockUser(blockerId: string, blockId: string) {
    await this.dataSource.transaction(async (manager) => {
      const result = await manager.delete(Block, { id: blockId, blockerId });
      if (result.affected === null || result.affected === 0) {
        throw new NotFoundException({
          error: { code: 'BLOCK_NOT_FOUND', message: 'Block not found' },
        });
      }

      // Write audit log
      await this.auditLogsService.logAction(manager, {
        actorId: blockerId,
        actorRole: 'member',
        action: 'user_unblock',
        targetType: 'block',
        targetId: blockId,
      });
    });
  }
}
