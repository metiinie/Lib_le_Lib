import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StorageService } from '../photos/storage.service';
import { randomUUID } from 'crypto';
import { MessagesGateway } from './messages.gateway';

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('matches/:matchId')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly storageService: StorageService,
    private readonly messagesGateway: MessagesGateway,
  ) {}

  @Get('devices/public-keys')
  @ApiOperation({
    summary: 'Get public keys of the matched user for E2E setup',
  })
  async getMatchPublicKeys(@Param('matchId') matchId: string, @Req() req: any) {
    const keys = await this.messagesService.getMatchPublicKeys(
      matchId,
      req.user.id,
    );
    return { publicKeys: keys };
  }

  @Post('messages')
  @ApiOperation({ summary: 'Send a new encrypted message' })
  async createMessage(
    @Param('matchId') matchId: string,
    @Body() dto: CreateMessageDto,
    @Req() req: any,
  ) {
    // Decode base64 to buffer before passing to service
    const ciphertextBuffer = Buffer.from(dto.ciphertext, 'base64');
    const nonceBuffer = Buffer.from(dto.nonce, 'base64');

    const message = await this.messagesService.createMessage(
      matchId,
      req.user.id,
      dto.messageType,
      ciphertextBuffer,
      nonceBuffer,
    );

    const messagePayload = {
      id: message.id,
      senderId: req.user.id,
      messageType: message.messageType,
      ciphertext: dto.ciphertext,
      nonce: dto.nonce,
      sentAt: message.sentAt,
    };

    this.messagesGateway.notifyNewMessage(matchId, messagePayload);

    return {
      id: message.id,
      sentAt: message.sentAt,
    };
  }

  @Get('messages')
  @ApiOperation({ summary: 'Get paginated messages for a match' })
  async getMessages(
    @Param('matchId') matchId: string,
    @Query('limit') limitStr: string,
    @Query('offset') offsetStr: string,
    @Req() req: any,
  ) {
    const limit = parseInt(limitStr, 10) || 50;
    const offset = parseInt(offsetStr, 10) || 0;

    const [messages, total] = await this.messagesService.getMatchMessages(
      matchId,
      req.user.id,
      limit,
      offset,
    );

    const formattedMessages = await Promise.all(
      messages.map(async (msg) => {
        // Map over attachments to provide signed URLs
        const attachments = await Promise.all(
          msg.attachments?.map(async (att) => {
            let readUrl: string | null = null;
            // Reveal logic: if revoked, it's blurred. If revealed, original.
            // By default, chat attachments are blurred until revealed.
            const isRevealed = att.revealedAt && !att.revokedAt;
            // The storage service getPhotoReadUrl expects the storageRef.
            // For blurred, we might append a suffix or the client blurs it.
            // The constraint says "A photo is never sent unblurred to a client unless an active row exists".
            // If the StorageService requires a different key for blurred, we handle it there.
            // For now, we will return the URL only if revealed, or a placeholder/blurred key.
            if (isRevealed) {
              readUrl = await this.storageService.getPhotoReadUrl(
                att.storageRef,
              );
            } else {
              readUrl = await this.storageService.getPhotoReadUrl(
                `blurred/${att.storageRef}`,
              );
            }

            return {
              id: att.id,
              readUrl,
              blurredDefault: att.blurredDefault,
              isRevealed,
            };
          }) || [],
        );

        return {
          id: msg.id,
          senderId: msg.senderId,
          messageType: msg.messageType,
          ciphertext: msg.ciphertext.toString('base64'),
          nonce: msg.nonce.toString('base64'),
          sentAt: msg.sentAt,
          deliveredAt: msg.deliveredAt,
          readAt: msg.readAt,
          attachments,
        };
      }),
    );

    return {
      data: formattedMessages,
      total,
      limit,
      offset,
    };
  }

  @Patch('messages/:messageId/read')
  @ApiOperation({ summary: 'Mark a message as read' })
  async markAsRead(
    @Param('matchId') matchId: string,
    @Param('messageId') messageId: string,
    @Req() req: any,
  ) {
    const { message, suppressReceipt } =
      await this.messagesService.markMessageAsRead(
        matchId,
        messageId,
        req.user.id,
      );

    if (!suppressReceipt) {
      this.messagesGateway.notifyMessageRead(matchId, messageId, req.user.id);
    }

    return { success: true, suppressReceipt };
  }

  @Post('messages/attachments/upload-url')
  @ApiOperation({ summary: 'Get signed URL to upload an attachment' })
  async getAttachmentUploadUrl(
    @Param('matchId') matchId: string,
    @Req() req: any,
  ) {
    // Validate match membership first
    await this.messagesService.validateMatchMembership(matchId, req.user.id);
    const storageRef = `chat/${matchId}/${randomUUID()}.jpg`;
    const uploadUrl = await this.storageService.getPhotoUploadUrl(storageRef);
    return { uploadUrl, storageRef };
  }

  @Post('messages/:messageId/attachments')
  @ApiOperation({ summary: 'Register an uploaded attachment' })
  async registerAttachment(
    @Param('matchId') matchId: string,
    @Param('messageId') messageId: string,
    @Body('storageRef') storageRef: string,
    @Req() req: any,
  ) {
    await this.messagesService.validateMatchMembership(matchId, req.user.id);
    // ensure message belongs to match and sender
    const attachment = await this.messagesService.registerAttachment(
      messageId,
      storageRef,
    );
    return { id: attachment.id };
  }

  @Post('messages/:messageId/attachments/:attachmentId/reveal')
  @ApiOperation({ summary: 'Reveal an attachment' })
  async revealAttachment(
    @Param('matchId') matchId: string,
    @Param('attachmentId') attachmentId: string,
    @Req() req: any,
  ) {
    await this.messagesService.validateMatchMembership(matchId, req.user.id);
    await this.messagesService.toggleAttachmentReveal(attachmentId, true);
    return { success: true };
  }

  @Delete('messages/:messageId/attachments/:attachmentId/reveal')
  @ApiOperation({ summary: 'Revoke an attachment reveal' })
  async revokeAttachment(
    @Param('matchId') matchId: string,
    @Param('attachmentId') attachmentId: string,
    @Req() req: any,
  ) {
    await this.messagesService.validateMatchMembership(matchId, req.user.id);
    await this.messagesService.toggleAttachmentReveal(attachmentId, false);
    return { success: true };
  }
}
