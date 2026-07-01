import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessagesRepository } from './repositories/messages.repository';
import { MessageAttachmentsRepository } from './repositories/message-attachments.repository';
import { Message, MessageType } from './entities/message.entity';
import { MessageAttachment } from './entities/message-attachment.entity';
import { Match } from '../matches/entities/match.entity';
import { Device } from '../users/entities/device.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { MatchesService } from '../matches/matches.service';
import { BlocksRepository } from '../safety/repositories/blocks.repository';

@Injectable()
export class MessagesService {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly messageAttachmentsRepository: MessageAttachmentsRepository,
    private readonly matchesService: MatchesService,
    @InjectRepository(Device)
    private readonly devicesRepository: Repository<Device>,
    @InjectRepository(Profile)
    private readonly profilesRepository: Repository<Profile>,
    private readonly blocksRepo: BlocksRepository,
  ) {}

  /**
   * Validates match membership and checks blocks.
   * Delegates core match validation to MatchesService.
   */
  async validateMatchMembership(
    matchId: string,
    userId: string,
  ): Promise<Match> {
    const match = await this.matchesService.validateMatchMembership(
      matchId,
      userId,
    );

    const otherUserId =
      match.userAId === userId ? match.userBId : match.userAId;
    const isBlocked = await this.blocksRepo.isBlocked(userId, otherUserId);
    if (isBlocked) {
      throw new ForbiddenException('This match is unavailable');
    }

    return match;
  }

  /**
   * Returns the public keys for the other user in the match.
   */
  async getMatchPublicKeys(matchId: string, userId: string): Promise<string[]> {
    const match = await this.validateMatchMembership(matchId, userId);

    // The other user is whoever is not the requesting user
    const targetUserId =
      match.userAId === userId ? match.userBId : match.userAId;

    const devices = await this.devicesRepository.find({
      where: { userId: targetUserId },
      select: ['publicKey'],
    });

    return devices.map((d) => d.publicKey).filter(Boolean) as string[];
  }

  /**
   * Saves an end-to-end encrypted message.
   * Expects ciphertext and nonce as Buffers. No plaintext code path.
   */
  async createMessage(
    matchId: string,
    senderId: string,
    messageType: MessageType,
    ciphertext: Buffer,
    nonce: Buffer,
  ): Promise<Message> {
    await this.validateMatchMembership(matchId, senderId);

    const message = this.messagesRepository.createMessage({
      matchId,
      senderId,
      messageType,
      ciphertext,
      nonce,
    });

    return this.messagesRepository.saveMessage(message);
  }

  /**
   * Retrieves paginated messages for a match, including their attachments.
   */
  async getMatchMessages(
    matchId: string,
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<[Message[], number]> {
    await this.validateMatchMembership(matchId, userId);

    return this.messagesRepository.findAndCountByMatchId(
      matchId,
      limit,
      offset,
    );
  }

  /**
   * Marks a message as read and returns whether the read receipt should be suppressed
   * due to the reader's discreet_mode setting.
   */
  async markMessageAsRead(
    matchId: string,
    messageId: string,
    readerId: string,
  ): Promise<{ message: Message; suppressReceipt: boolean }> {
    await this.validateMatchMembership(matchId, readerId);

    const message = await this.messagesRepository.findByIdAndMatchId(
      messageId,
      matchId,
    );

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Only mark as read if the reader is NOT the sender
    if (message.senderId !== readerId && !message.readAt) {
      message.readAt = new Date();
      await this.messagesRepository.saveMessage(message);
    }

    const readerProfile = await this.profilesRepository.findOne({
      where: { userId: readerId },
      select: ['discreetMode'],
    });

    return {
      message,
      suppressReceipt: readerProfile?.discreetMode || false,
    };
  }

  /**
   * Registers a message attachment
   */
  async registerAttachment(
    messageId: string,
    storageRef: string,
  ): Promise<MessageAttachment> {
    const attachment = this.messageAttachmentsRepository.createAttachment({
      messageId,
      storageRef,
      blurredDefault: true,
    });
    return this.messageAttachmentsRepository.saveAttachment(attachment);
  }

  /**
   * Reveal or revoke a message attachment
   */
  async toggleAttachmentReveal(
    attachmentId: string,
    reveal: boolean,
  ): Promise<MessageAttachment> {
    const attachment =
      await this.messageAttachmentsRepository.findById(attachmentId);
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    if (reveal) {
      attachment.revealedAt = new Date();
      attachment.revokedAt = null;
    } else {
      attachment.revokedAt = new Date();
      attachment.revealedAt = null; // Option to clear or just set revoked_at
    }

    return this.messageAttachmentsRepository.saveAttachment(attachment);
  }
}
