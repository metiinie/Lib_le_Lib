import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  Report,
  ReportCategory,
  ReportSeverity,
  ReportStatus,
} from './entities/report.entity';
import {
  ModerationAction,
  ModerationActionType,
} from './entities/moderation-action.entity';
import { AuditLogsService } from './audit-logs.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ModerationActionDto } from './dto/moderation-action.dto';
import { User } from '../users/entities/user.entity';
import { ReportsRepository } from './repositories/reports.repository';

@Injectable()
export class ReportsService {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly auditLogsService: AuditLogsService,
    private readonly dataSource: DataSource,
  ) {}

  async createReport(
    reporterId: string,
    dto: CreateReportDto,
  ): Promise<Report> {
    // Basic severity determination based on category
    let severity = ReportSeverity.LOW;
    if (
      [
        ReportCategory.HARASSMENT,
        ReportCategory.SCAM,
        ReportCategory.FAKE_PROFILE,
      ].includes(dto.category)
    ) {
      severity = ReportSeverity.MEDIUM;
    }
    if (
      [
        ReportCategory.OUTING_THREAT,
        ReportCategory.UNDERAGE_SUSPICION,
      ].includes(dto.category)
    ) {
      severity = ReportSeverity.HIGH;
    }

    const report = this.reportsRepository.create({
      reporterId,
      reportedId: dto.reportedId,
      matchId: dto.matchId,
      category: dto.category,
      description: dto.description,
      evidenceRef: dto.evidenceRef,
      severity,
    });

    const savedReport = await this.reportsRepository.save(report);

    // Audit log for report creation
    await this.auditLogsService.logAction(this.dataSource.manager, {
      actorId: reporterId,
      actorRole: 'member', // Assuming reporter is always a member
      action: 'report_created',
      targetType: 'report',
      targetId: savedReport.id,
      metadata: { reportedId: dto.reportedId, category: dto.category },
    });

    return savedReport;
  }

  async getQueue(
    limit: number = 50,
    offset: number = 0,
  ): Promise<[Report[], number]> {
    return this.reportsRepository.findAndCount({
      where: { status: ReportStatus.OPEN },
      order: {
        // Enums aren't easily sortable directly in TypeORM without custom queries,
        // but for simplicity, we will just sort by createdAt. Ideally, high severity first.
        severity: 'DESC',
        createdAt: 'ASC',
      },
      take: limit,
      skip: offset,
      relations: ['reporter', 'reported'],
    });
  }

  async performAction(
    actorId: string,
    actorRole: string,
    reportId: string,
    dto: ModerationActionDto,
  ): Promise<ModerationAction> {
    const report = await this.reportsRepository.findOne({
      where: { id: reportId },
      relations: ['reported'],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    // Run everything in a single transaction
    return this.dataSource.transaction(async (manager) => {
      // 1. Create the moderation action
      const moderationAction = manager.create(ModerationAction, {
        reportId: report.id,
        targetUserId: report.reportedId,
        actorId,
        action: dto.action,
        reason: dto.reason,
      });
      const savedAction = await manager.save(moderationAction);

      // 2. Update target user status if needed
      const targetUser = await manager.findOne(User, {
        where: { id: report.reportedId },
      });
      if (targetUser) {
        let statusChanged = false;
        if (dto.action === ModerationActionType.BAN) {
          targetUser.status = 'banned';
          statusChanged = true;
        } else if (dto.action === ModerationActionType.SUSPEND) {
          targetUser.status = 'suspended';
          statusChanged = true;
        }

        if (statusChanged) {
          await manager.save(targetUser);
        }
      }

      // 3. Mark report as resolved
      report.status = ReportStatus.RESOLVED;
      report.resolvedAt = new Date();
      report.assignedToId = actorId;
      await manager.save(report);

      // 4. Write audit log
      await this.auditLogsService.logAction(manager, {
        actorId,
        actorRole,
        action: `moderation_action_${dto.action}`,
        targetType: 'user',
        targetId: report.reportedId,
        metadata: { reportId: report.id, reason: dto.reason },
      });

      return savedAction;
    });
  }
}
