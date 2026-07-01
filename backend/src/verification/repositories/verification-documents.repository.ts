import { Injectable } from '@nestjs/common';
import { DataSource, Repository, LessThan, Not, IsNull } from 'typeorm';
import { VerificationDocument } from '../entities/verification-document.entity';

@Injectable()
export class VerificationDocumentsRepository {
  private readonly repo: Repository<VerificationDocument>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(VerificationDocument);
  }

  async create(data: {
    verificationRecordId: string;
    documentType: string;
    storageRef: string;
  }): Promise<VerificationDocument> {
    const doc = this.repo.create(data);
    return this.repo.save(doc);
  }

  async findByRecordId(
    verificationRecordId: string,
  ): Promise<VerificationDocument[]> {
    return this.repo.find({ where: { verificationRecordId } });
  }

  async nullStorageRef(
    id: string,
    manager?: import('typeorm').EntityManager,
  ): Promise<void> {
    const targetRepo = manager
      ? manager.getRepository(VerificationDocument)
      : this.repo;
    await targetRepo.update(
      { id },
      { storageRef: null as any, deletedAt: new Date() },
    );
  }

  async findPurgeable(before: Date): Promise<VerificationDocument[]> {
    return this.repo.find({
      where: {
        storageRef: Not(IsNull()),
        verificationRecord: {
          decisionAt: LessThan(before),
        },
      },
      relations: ['verificationRecord'], // Required for the relation condition above
    });
  }
}
