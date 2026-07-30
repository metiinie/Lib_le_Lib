import { Injectable } from '@nestjs/common';
import { DataSource, Repository, IsNull } from 'typeorm';
import { QaThread, QaThreadStatus } from '../entities/qa-thread.entity';

@Injectable()
export class QaThreadsRepository {
  private readonly repo: Repository<QaThread>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(QaThread);
  }

  async createThread(memberId: string): Promise<QaThread> {
    const thread = this.repo.create({
      memberId,
      status: QaThreadStatus.OPEN,
    });
    return this.repo.save(thread);
  }

  async findById(id: string): Promise<QaThread | null> {
    return this.repo.findOne({ where: { id } });
  }

  async saveThread(thread: QaThread): Promise<QaThread> {
    return this.repo.save(thread);
  }

  async findByMemberId(memberId: string): Promise<QaThread[]> {
    return this.repo.find({
      where: { memberId },
      order: { createdAt: 'DESC' },
      relations: ['messages'],
    });
  }

  async findForProfessional(healthProfessionalId: string): Promise<QaThread[]> {
    return this.repo.find({
      where: [
        { healthProfessionalId },
        { healthProfessionalId: IsNull(), status: QaThreadStatus.OPEN },
      ],
      order: { createdAt: 'DESC' },
      relations: ['messages', 'member', 'healthProfessional'],
    });
  }

  async findAllForAdmin(status?: string): Promise<QaThread[]> {
    const qb = this.repo.createQueryBuilder('thread')
      .leftJoinAndSelect('thread.member', 'member')
      .leftJoinAndSelect('member.profile', 'memberProfile')
      .leftJoinAndSelect('thread.healthProfessional', 'hp')
      .leftJoinAndSelect('hp.profile', 'hpProfile')
      .leftJoinAndSelect('thread.messages', 'messages')
      .orderBy('thread.createdAt', 'DESC');

    if (status && status !== 'all') {
      qb.where('thread.status = :status', { status });
    }

    return qb.getMany();
  }
}
