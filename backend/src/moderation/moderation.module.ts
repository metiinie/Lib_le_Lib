import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { AdminAuditController } from './admin-audit.controller';
import { ReportsService } from './reports.service';
import { AuditLogsService } from './audit-logs.service';
import { Report } from './entities/report.entity';
import { ModerationAction } from './entities/moderation-action.entity';
import { AuditLog } from './entities/audit-log.entity';
import { ReportsRepository } from './repositories/reports.repository';
import { PhotosModule } from '../photos/photos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report, ModerationAction, AuditLog]),
    PhotosModule,
  ],
  controllers: [ReportsController, AdminAuditController],
  providers: [ReportsRepository, ReportsService, AuditLogsService],
  exports: [AuditLogsService, ReportsService, ReportsRepository],
})
export class ModerationModule {}
