import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { VerificationRecord } from './entities/verification-record.entity';
import { VerificationDocument } from './entities/verification-document.entity';
import { LivenessCheck } from './entities/liveness-check.entity';
import { AuditLog } from './entities/audit-log.entity';

import { VerificationRecordsRepository } from './repositories/verification-records.repository';
import { VerificationDocumentsRepository } from './repositories/verification-documents.repository';
import { AuditLogsRepository } from './repositories/audit-logs.repository';

import { VerificationStorageService } from './verification-storage.service';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';
import { VerificationScheduler } from './verification.scheduler';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VerificationRecord,
      VerificationDocument,
      LivenessCheck,
      AuditLog,
    ]),
  ],
  controllers: [VerificationController],
  providers: [
    VerificationRecordsRepository,
    VerificationDocumentsRepository,
    AuditLogsRepository,
    VerificationStorageService,
    VerificationService,
    VerificationScheduler,
  ],
  exports: [VerificationService, AuditLogsRepository],
})
export class VerificationModule {}
