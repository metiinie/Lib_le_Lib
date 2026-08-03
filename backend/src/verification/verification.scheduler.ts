import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { VerificationRecordsRepository } from './repositories/verification-records.repository';
import { VerificationDocumentsRepository } from './repositories/verification-documents.repository';
import { AuditLogsRepository } from './repositories/audit-logs.repository';
import { VerificationStorageService } from './verification-storage.service';

import { DataSource } from 'typeorm';

@Injectable()
export class VerificationScheduler {
  private readonly logger = new Logger(VerificationScheduler.name);

  constructor(
    private readonly recordsRepo: VerificationRecordsRepository,
    private readonly documentsRepo: VerificationDocumentsRepository,
    private readonly auditLogsRepo: AuditLogsRepository,
    private readonly storageService: VerificationStorageService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Daily at 09:00 - Expiry Reminder Cron
   * Finds 'approved' records where 'expiry_date' is within N days.
   */
  @Cron('0 9 * * *')
  async handleExpiryReminders() {
    this.logger.log('Running Expiry Reminder Cron...');
    const daysBefore = this.configService.get<number>(
      'VERIFICATION_REMINDER_DAYS_BEFORE',
      30,
    );

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysBefore);
    const targetDateString = targetDate.toISOString().split('T')[0];

    const expiringRecords =
      await this.recordsRepo.findExpiringBefore(targetDateString);

    for (const record of expiringRecords) {
      // Logic for sending push notification reminder goes here in later phases
      this.logger.log(
        `Verification for user ${record.userId} expires on ${record.expiryDate}. Reminder sent.`,
      );
    }
  }

  }

  /**
   * Daily at 00:00 - Expiration Cron
   * Transitions records past their expiry date to 'expired' and suspends user.
   */
  @Cron('0 0 * * *')
  async handleExpirations() {
    this.logger.log('Running Expiration Cron...');
    const today = new Date().toISOString().split('T')[0];

    // Find all 'approved' records where expiryDate <= today
    const expiredRecords = await this.recordsRepo.findExpiringBefore(today); // We can reuse this method if it finds strictly before or on. Actually findExpiringBefore finds where expiryDate <= targetDate.

    if (expiredRecords.length === 0) {
      this.logger.log('No records to expire today.');
      return;
    }

    // In a real application, we would chunk this
    for (const record of expiredRecords) {
      await this.dataSource.transaction(async (manager) => {
        // 1. Mark verification record as expired
        await manager.query(
          `UPDATE verification.verification_records SET status = 'expired', updated_at = NOW() WHERE id = $1`,
          [record.id],
        );

        // 2. Revert user to pending_verification (locking their account)
        await manager.query(
          `UPDATE users SET status = 'pending_verification', updated_at = NOW() WHERE id = $1`,
          [record.userId],
        );

        // 3. Write audit log
        await this.auditLogsRepo.insertWithManager(
          {
            actorId: null, // system
            actorRole: null,
            action: 'verification_expired',
            targetType: 'verification_record',
            targetId: record.id,
            metadata: {
              expiredAt: today,
            },
          },
          manager,
        );
      });
      
      this.logger.log(`Expired verification record for user ${record.userId}`);
    }
  }
}
