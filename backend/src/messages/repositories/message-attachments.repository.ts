import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { MessageAttachment } from '../entities/message-attachment.entity';

@Injectable()
export class MessageAttachmentsRepository {
  private readonly repo: Repository<MessageAttachment>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(MessageAttachment);
  }

  createAttachment(data: Partial<MessageAttachment>): MessageAttachment {
    return this.repo.create(data);
  }

  async saveAttachment(
    attachment: MessageAttachment,
  ): Promise<MessageAttachment> {
    return this.repo.save(attachment);
  }

  async findById(id: string): Promise<MessageAttachment | null> {
    return this.repo.findOne({ where: { id } });
  }
}
