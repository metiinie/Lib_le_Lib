import { Injectable } from '@nestjs/common';
import { DataSource, Repository, LessThan } from 'typeorm';
import { VerificationRecord } from '../entities/verification-record.entity';

@Injectable()
export class VerificationRecordsRepository {
  private readonly repo: Repository<VerificationRecord>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(VerificationRecord);
  }

  async create(
    userId: string,
    method: string = 'self_upload',
  ): Promise<VerificationRecord> {
    const record = this.repo.create({ userId, method, status: 'submitted' });
    return this.repo.save(record);
  }

  async findById(id: string): Promise<VerificationRecord | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['user', 'user.profile'],
    });
  }

  async findByUserId(userId: string): Promise<VerificationRecord | null> {
    return this.repo.findOne({
      where: { userId },
      order: { submittedAt: 'DESC' },
      relations: ['user', 'user.profile'],
    });
  }

  async findQueue(status?: string): Promise<VerificationRecord[]> {
    const qb = this.repo.createQueryBuilder('record')
      .leftJoinAndSelect('record.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .orderBy('record.submittedAt', 'DESC');

    if (status && status !== 'all') {
      qb.where('record.status = :status', { status });
    } else if (!status) {
      qb.where('record.status IN (:...pendingStatuses)', {
        pendingStatuses: ['submitted', 'in_review'],
      });
    }

    return qb.getMany();
  }

  async updateStatus(
    id: string,
    patch: {
      status: string;
      decisionAt?: Date;
      reviewerId?: string;
      rejectionReason?: string;
      expiryDate?: string;
    },
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
