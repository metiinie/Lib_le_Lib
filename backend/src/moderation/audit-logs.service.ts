import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  /**
   * Writes an audit log using the provided EntityManager to ensure it's part of an existing transaction.
   */
  async logAction(
    manager: EntityManager,
    params: {
      actorId?: string;
      actorRole?: string;
      action: string;
      targetType: string;
      targetId?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<AuditLog> {
    const log = manager.create(AuditLog, {
      actorId: params.actorId,
      actorRole: params.actorRole,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      metadata: params.metadata || {},
    });
    return manager.save(log);
  }

  async getAuditLogs(limit = 50, offset = 0): Promise<{ data: AuditLog[]; total: number }> {
    const [data, total] = await this.repo.findAndCount({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return { data, total };
  }
}
