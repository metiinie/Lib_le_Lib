import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { VerificationRecordsRepository } from './repositories/verification-records.repository';
import { VerificationDocumentsRepository } from './repositories/verification-documents.repository';
import { AuditLogsRepository } from './repositories/audit-logs.repository';
import { VerificationStorageService } from './verification-storage.service';

@Injectable()
export class VerificationScheduler {
  private readonly logger = new Logger(VerificationScheduler.name);

  constructor(
    private readonly recordsRepo: VerificationRecordsRepository,
    private readonly documentsRepo: VerificationDocumentsRepository,
    private readonly auditLogsRepo: AuditLogsRepository,
    private readonly storageService: VerificationStorageService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Daily at 09:00 - Expiry Reminder Cron
   * Finds 'approved' records where 'expiry_date' is within N days.
   */
  @Cron('0 9 * * *')
  async handleExpiryReminders() {
    this.logger.log('Running Expiry Reminder Cron...');
    const daysBefore = this.configService.get<number>('VERIFICATION_REMINDER_DAYS_BEFORE', 30);
    
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysBefore);
    const targetDateString = targetDate.toISOString().split('T')[0];

    const expiringRecords = await this.recordsRepo.findExpiringBefore(targetDateString);

    for (const record of expiringRecords) {
      // Logic for sending push notification reminder goes here in later phases
      this.logger.log(`Verification for user ${record.userId} expires on ${record.expiryDate}. Reminder sent.`);
    }
  }

  /**
   * Daily at 02:00 - Document Retention Purge Cron
   * Deletes raw documents from S3 and nulls the storage_ref in DB
   * if the decision was made more than N days ago.
   */
  @Cron('0 2 * * *')
  async handleDocumentRetentionPurge() {
    this.logger.log('Running Document Retention Purge Cron...');
    const retentionDays = this.configService.get<number>('VERIFICATION_RETENTION_DAYS', 30);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const purgeableDocs = await this.documentsRepo.findPurgeable(cutoffDate);

    for (const doc of purgeableDocs) {
      if (!doc.storageRef) continue;

      try {
        // 1. Delete from S3
        await this.storageService.deleteDocument(doc.storageRef);

        // 2. Null out storage_ref in DB
        await this.documentsRepo.nullStorageRef(doc.id);

        // 3. Write audit log (system action -> actorId = null)
        await this.auditLogsRepo.insertWithManager({
          actorId: undefined,
          action: 'document_retention_purge',
          targetType: 'verification_document',
          targetId: doc.id,
          metadata: {
            storageRef: doc.storageRef, // Store what we deleted just in case
            deletedAt: new Date(),
          },
        });

        this.logger.log(`Successfully purged document ${doc.id}`);
      } catch (error) {
        this.logger.error(`Failed to purge document ${doc.id}`, error);
      }
    }
  }
}
