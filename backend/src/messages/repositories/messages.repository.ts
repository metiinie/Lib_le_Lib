import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Message, MessageType } from '../entities/message.entity';

@Injectable()
export class MessagesRepository {
  private readonly repo: Repository<Message>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(Message);
  }

  createMessage(data: Partial<Message>): Message {
    return this.repo.create(data);
  }

  async saveMessage(message: Message): Promise<Message> {
    return this.repo.save(message);
  }

  async findAndCountByMatchId(
    matchId: string,
    limit: number,
    offset: number,
  ): Promise<[Message[], number]> {
    return this.repo.findAndCount({
      where: { matchId },
      relations: ['attachments'],
      order: { sentAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async findByIdAndMatchId(
    id: string,
    matchId: string,
  ): Promise<Message | null> {
    return this.repo.findOne({ where: { id, matchId } });
  }
}
