import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { VerificationRecordsRepository } from './repositories/verification-records.repository';
import { VerificationDocumentsRepository } from './repositories/verification-documents.repository';
import { AuditLogsRepository } from './repositories/audit-logs.repository';
import { VerificationStorageService } from './verification-storage.service';
import { SubmitVerificationDto } from './dto/submit-verification.dto';
import { DecideVerificationDto } from './dto/decide-verification.dto';
import { VerificationRecord } from './entities/verification-record.entity';

@Injectable()
export class VerificationService {
  constructor(
    private readonly recordsRepo: VerificationRecordsRepository,
    private readonly documentsRepo: VerificationDocumentsRepository,
    private readonly auditLogsRepo: AuditLogsRepository,
    private readonly storageService: VerificationStorageService,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Submits a new verification request.
   * Generates a signed PUT URL for the client to upload the document.
   */
  async submitVerification(userId: string, dto: SubmitVerificationDto) {
    // Check if a pending record already exists
    const existing = await this.recordsRepo.findByUserId(userId);
    if (existing && ['submitted', 'in_review'].includes(existing.status)) {
      throw new ConflictException({
        error: { code: 'VERIFICATION_PENDING', message: 'You already have a verification request pending.' },
      });
    }

    if (existing && existing.status === 'rejected' && existing.decisionAt) {
      const hoursSinceRejection = (Date.now() - existing.decisionAt.getTime()) / (1000 * 60 * 60);
      const cooldownHours = this.configService.get<number>('VERIFICATION_RESUBMISSION_COOLDOWN_HOURS', 24);
      if (hoursSinceRejection < cooldownHours) {
        throw new ConflictException({
          error: { code: 'VERIFICATION_RATE_LIMITED', message: `Please wait ${cooldownHours} hours before resubmitting after a rejection.` },
        });
      }
    }

    // Create record
    const record = await this.recordsRepo.create(userId, 'self_upload');

    // Generate storage ref and signed URL
    const ext = dto.contentType ? dto.contentType.split('/')[1] : 'pdf';
    const key = uuidv4();
    const storageRef = `verification/${userId}/${key}.${ext}`;
    
    const uploadUrl = await this.storageService.getDocumentUploadUrl(storageRef, dto.contentType);

    // Create document row
    await this.documentsRepo.create({
      verificationRecordId: record.id,
      documentType: dto.documentType,
      storageRef,
    });

    return {
      uploadUrl,
      // storageRef is explicitly NOT returned to the client per constraints
    };
  }

  /**
   * Returns the current user's verification status.
   */
  async getMyStatus(userId: string) {
    const record = await this.recordsRepo.findByUserId(userId);
    if (!record) {
      return { status: 'none' };
    }
    return { status: record.status, rejectionReason: record.rejectionReason, expiryDate: record.expiryDate };
  }

  /**
   * Returns the queue of pending verifications for officers.
   * Resolves signed GET URLs for the attached documents.
   */
  async getQueue() {
    const queue = await this.recordsRepo.findQueue();
    
    // We map over each record to fetch its documents and generate signed URLs
    const result = await Promise.all(
      queue.map(async (record) => {
        const docs = await this.documentsRepo.findByRecordId(record.id);
        const mappedDocs = await Promise.all(
          docs.map(async (doc) => {
            if (!doc.storageRef) return { ...doc, url: null };
            const url = await this.storageService.getDocumentReadUrl(doc.storageRef);
            return {
              id: doc.id,
              documentType: doc.documentType,
              uploadedAt: doc.uploadedAt,
              url, // Temporary signed URL
            };
          })
        );
        return {
          id: record.id,
          userId: record.userId,
          status: record.status,
          submittedAt: record.submittedAt,
          method: record.method,
          documents: mappedDocs,
        };
      })
    );
    return result;
  }

  /**
   * Processes an officer's decision on a verification record.
   * Wrapped in a transaction to guarantee the audit log is always written.
   */
  async decide(officerId: string, recordId: string, dto: DecideVerificationDto) {
    const record = await this.recordsRepo.findById(recordId);
    if (!record) {
      throw new NotFoundException({
        error: { code: 'RECORD_NOT_FOUND', message: 'Verification record not found.' },
      });
    }

    if (!['submitted', 'in_review'].includes(record.status)) {
      throw new ConflictException({
        error: { code: 'INVALID_STATUS', message: 'Record is not pending review.' },
      });
    }

    let expiryDateString: string | undefined;

    if (dto.decision === 'approved') {
      const expiryMonths = this.configService.get<number>('VERIFICATION_EXPIRY_MONTHS', 12);
      const date = new Date();
      date.setMonth(date.getMonth() + expiryMonths);
      // Format as YYYY-MM-DD for PostgreSQL DATE column
      expiryDateString = date.toISOString().split('T')[0];
    }

    await this.dataSource.transaction(async (manager) => {
      // 1. Update record status
      await manager.update(VerificationRecord, { id: recordId }, {
        status: dto.decision,
        decisionAt: new Date(),
        reviewerId: officerId,
        rejectionReason: dto.decision === 'rejected' ? dto.rejectionReason : null,
        expiryDate: expiryDateString as any, // TypeORM type issue with date column string/Date
        updatedAt: new Date(),
      });

      // 2. Write audit log
      await this.auditLogsRepo.insertWithManager({
        actorId: officerId,
        actorRole: 'verification_officer',
        action: 'verification_decision',
        targetType: 'verification_record',
        targetId: recordId,
        metadata: {
          decision: dto.decision,
          rejectionReason: dto.rejectionReason,
        },
      }, manager);
    });

    return { message: `Verification request ${dto.decision}.` };
  }
}
