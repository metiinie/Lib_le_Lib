import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { QaThreadsRepository } from './repositories/qa-threads.repository';
import { QaMessagesRepository } from './repositories/qa-messages.repository';
import { QaThread, QaThreadStatus } from './entities/qa-thread.entity';
import { QaMessage } from './entities/qa-message.entity';
import { CreateQaThreadDto } from './dto/create-qa-thread.dto';
import { ReplyQaThreadDto } from './dto/reply-qa-thread.dto';

@Injectable()
export class QaService {
  constructor(
    private readonly qaThreadRepository: QaThreadsRepository,
    private readonly qaMessageRepository: QaMessagesRepository,
  ) {}

  async createThread(
    memberId: string,
    createDto: CreateQaThreadDto,
  ): Promise<QaThread> {
    const savedThread = await this.qaThreadRepository.createThread(memberId);
    await this.qaMessageRepository.createMessage(
      savedThread.id,
      memberId,
      createDto.message,
    );
    return savedThread;
  }

  async replyToThread(
    threadId: string,
    senderId: string,
    senderRole: string,
    replyDto: ReplyQaThreadDto,
  ): Promise<QaMessage> {
    const thread = await this.qaThreadRepository.findById(threadId);
    if (!thread) {
      throw new NotFoundException('QA thread not found');
    }

    if (thread.status === QaThreadStatus.CLOSED) {
      throw new ForbiddenException('Cannot reply to a closed thread');
    }

    // Verify ownership or assignment
    if (senderRole === 'member' && thread.memberId !== senderId) {
      throw new ForbiddenException('Not authorized to reply to this thread');
    }

    // Auto-assign HP if unassigned (Fix for M4)
    if (senderRole === 'health_professional' && !thread.healthProfessionalId) {
      thread.healthProfessionalId = senderId;
    } else if (
      senderRole === 'health_professional' &&
      thread.healthProfessionalId !== senderId
    ) {
      throw new ForbiddenException('Not assigned to this thread');
    }

    const message = await this.qaMessageRepository.createMessage(
      thread.id,
      senderId,
      replyDto.message,
    );

    // Update thread status
    if (
      senderRole === 'health_professional' &&
      thread.status === QaThreadStatus.OPEN
    ) {
      thread.status = QaThreadStatus.ANSWERED;
    }

    // Save any thread updates (assignment or status change)
    if (senderRole === 'health_professional') {
      await this.qaThreadRepository.saveThread(thread);
    }

    return message;
  }

  async assignThread(
    threadId: string,
    healthProfessionalId: string,
  ): Promise<QaThread> {
    const thread = await this.qaThreadRepository.findById(threadId);
    if (!thread) {
      throw new NotFoundException('QA thread not found');
    }

    if (thread.healthProfessionalId) {
      throw new ForbiddenException('Thread already assigned');
    }

    thread.healthProfessionalId = healthProfessionalId;
    return this.qaThreadRepository.saveThread(thread);
  }

  async getMemberThreads(memberId: string): Promise<QaThread[]> {
    return this.qaThreadRepository.findByMemberId(memberId);
  }

  async getProfessionalThreads(
    healthProfessionalId: string,
  ): Promise<QaThread[]> {
    return this.qaThreadRepository.findForProfessional(healthProfessionalId);
  }
}
