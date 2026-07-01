import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { QaMessage } from '../entities/qa-message.entity';

@Injectable()
export class QaMessagesRepository {
  private readonly repo: Repository<QaMessage>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(QaMessage);
  }

  async createMessage(
    threadId: string,
    senderId: string,
    content: string,
  ): Promise<QaMessage> {
    const message = this.repo.create({
      threadId,
      senderId,
      content,
    });
    return this.repo.save(message);
  }
}
