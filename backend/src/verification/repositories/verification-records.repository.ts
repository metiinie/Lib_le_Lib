import { Injectable } from '@nestjs/common';
import { DataSource, Repository, LessThan } from 'typeorm';
import { VerificationRecord } from '../entities/verification-record.entity';

@Injectable()
export class VerificationRecordsRepository {
  private readonly repo: Repository<VerificationRecord>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(VerificationRecord);
  }

  async create(userId: string, method: string = 'self_upload'): Promise<VerificationRecord> {
    const record = this.repo.create({ userId, method, status: 'submitted' });
    return this.repo.save(record);
  }

  async findById(id: string): Promise<VerificationRecord | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByUserId(userId: string): Promise<VerificationRecord | null> {
    // Return latest record for this user
    return this.repo.findOne({
      where: { userId },
      order: { submittedAt: 'DESC' },
    });
  }

  async findQueue(): Promise<VerificationRecord[]> {
    return this.repo.find({
      where: [
        { status: 'submitted' },
        { status: 'in_review' }
      ],
      order: { submittedAt: 'ASC' },
      relations: ['user'], // Likely need some user details for the officer to review
    });
  }

  async updateStatus(
    id: string,
    patch: {
      status: string;
      decisionAt?: Date;
      reviewerId?: string;
      rejectionReason?: string;
      expiryDate?: string; // string because of DATE column mapping
    }
  ): Promise<void> {
    await this.repo.update({ id }, patch);
  }

  async findExpiringBefore(date: string): Promise<VerificationRecord[]> {
    return this.repo.find({
      where: {
        status: 'approved',
        expiryDate: LessThan(date),
      },
    });
  }
}
