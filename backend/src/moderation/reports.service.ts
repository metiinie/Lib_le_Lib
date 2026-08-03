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
import { User, UserStatus } from '../users/entities/user.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { Photo } from '../photos/entities/photo.entity';
import { ReportsRepository } from './repositories/reports.repository';
import { StorageService } from '../photos/storage.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly auditLogsService: AuditLogsService,
    private readonly dataSource: DataSource,
    private readonly storageService: StorageService,
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

    return this.dataSource.transaction(async (manager) => {
      const report = manager.create(Report, {
        reporterId,
        reportedId: dto.reportedId,
        matchId: dto.matchId,
        category: dto.category,
        description: dto.description,
        evidenceRef: dto.evidenceRef,
        severity,
      });

      const savedReport = await manager.save(report);

      // Audit log for report creation
      await this.auditLogsService.logAction(manager, {
        actorId: reporterId,
        actorRole: 'member',
        action: 'report_created',
        targetType: 'report',
        targetId: savedReport.id,
        metadata: { reportedId: dto.reportedId, category: dto.category },
      });

      return savedReport;
    });
  }

  async getQueue(
    limit: number = 50,
    offset: number = 0,
    status?: ReportStatus,
    severity?: ReportSeverity,
    category?: ReportCategory,
  ): Promise<[Report[], number]> {
    return this.reportsRepository.findFilteredQueue(
      limit,
      offset,
      status,
      severity,
      category,
    );
  }

  async getReportDetails(reportId: string): Promise<Report> {
    const report = await this.reportsRepository.findOne({
      where: { id: reportId },
      relations: ['reporter', 'reporter.profile', 'reported', 'reported.profile', 'assignedTo'],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  async updateUserStatus(
    actorId: string,
    actorRole: string,
    targetUserId: string,
    status: UserStatus,
    reason?: string,
  ): Promise<User> {
    return this.dataSource.transaction(async (manager) => {
      const targetUser = await manager.findOne(User, {
        where: { id: targetUserId },
      });

      if (!targetUser) {
        throw new NotFoundException('User not found');
      }

      const previousStatus = targetUser.status;
      targetUser.status = status;
      const savedUser = await manager.save(targetUser);

      await this.auditLogsService.logAction(manager, {
        actorId,
        actorRole,
        action: `user_status_changed_to_${status}`,
        targetType: 'user',
        targetId: targetUserId,
        metadata: { previousStatus, newStatus: status, reason },
      });

      const { passwordHash, ...safe } = savedUser;
      return safe as User;
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

      // 3. Mark report as resolved or dismissed
      if (dto.action === ModerationActionType.NONE) {
        report.status = ReportStatus.DISMISSED;
      } else {
        report.status = ReportStatus.RESOLVED;
      }
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

  async getUserContent(
    actorId: string,
    actorRole: string,
    targetUserId: string,
  ) {
    const profile = await this.dataSource.manager.findOne(Profile, {
      where: { userId: targetUserId },
    });
    
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const photos = await this.dataSource.manager.find(Photo, {
      where: { profileId: targetUserId },
      order: { position: 'ASC' },
    });

    const mappedPhotos = await Promise.all(
      photos.map(async (p) => {
        const url = await this.storageService.getPhotoReadUrl(p.storageRef);
        return {
          id: p.id,
          url,
          isPrimary: p.isPrimary,
          position: p.position,
        };
      })
    );

    await this.auditLogsService.logAction(this.dataSource.manager, {
      actorId,
      actorRole,
      action: 'user_content_read',
      targetType: 'user',
      targetId: targetUserId,
      metadata: { reason: 'Moderation review' },
    });

    return {
      bio: profile.bio,
      nickname: profile.nickname,
      photos: mappedPhotos,
    };
  }

  async resetUserBio(
    actorId: string,
    actorRole: string,
    targetUserId: string,
    reason: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const profile = await manager.findOne(Profile, {
        where: { userId: targetUserId },
      });

      if (!profile) {
        throw new NotFoundException('Profile not found');
      }

      profile.bio = '[Removed by Moderator]';
      await manager.save(profile);

      await this.auditLogsService.logAction(manager, {
        actorId,
        actorRole,
        action: 'bio_reset',
        targetType: 'user',
        targetId: targetUserId,
        metadata: { reason },
      });

      return { success: true };
    });
  }

  async deleteUserPhoto(
    actorId: string,
    actorRole: string,
    targetUserId: string,
    photoId: string,
    reason: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const photo = await manager.findOne(Photo, {
        where: { id: photoId, profileId: targetUserId },
      });

      if (!photo) {
        throw new NotFoundException('Photo not found for this user');
      }

      await manager.remove(photo);

      await this.auditLogsService.logAction(manager, {
        actorId,
        actorRole,
        action: 'photo_deleted',
        targetType: 'user',
        targetId: targetUserId,
        metadata: { reason, deletedPhotoId: photoId },
      });

      return { success: true };
    });
  }
}
