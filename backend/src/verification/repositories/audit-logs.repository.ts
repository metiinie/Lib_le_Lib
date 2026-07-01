import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogsRepository {
  private readonly repo: Repository<AuditLog>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(AuditLog);
  }

  /**
   * Inserts an audit log entry.
   * Can optionally take an EntityManager to run within a transaction.
   */
  async insertWithManager(
    entry: Partial<AuditLog>,
    manager?: EntityManager,
  ): Promise<AuditLog> {
    const activeManager = manager || this.dataSource.manager;
    const log = activeManager.create(AuditLog, entry);
    return activeManager.save(AuditLog, log);
  }
}
