import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { MessagesService } from './messages.service';

@WebSocketGateway({ namespace: '/chat', cors: true })
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagesGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly messagesService: MessagesService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        throw new Error('No token provided');
      }

      const payload = this.jwtService.verify(token);
      client.data.user = payload; // store user in socket data
      this.logger.log(`Client connected: ${client.id} (User: ${payload.sub})`);
    } catch (error: any) {
      this.logger.error(`Connection failed: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_match')
  async handleJoinMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody('matchId') matchId: string,
  ) {
    try {
      const userId = client.data.user.sub || client.data.user.id;
      await this.messagesService.validateMatchMembership(matchId, userId);

      const roomName = `match_${matchId}`;
      client.join(roomName);
      this.logger.log(`User ${userId} joined room ${roomName}`);
      return { event: 'joined', data: roomName };
    } catch (e) {
      return { event: 'error', data: 'Unauthorized to join match' };
    }
  }

  /**
   * Broadcasts a new message to the match room.
   */
  notifyNewMessage(matchId: string, messagePayload: any) {
    this.server.to(`match_${matchId}`).emit('new_message', messagePayload);
  }

  /**
   * Broadcasts a read receipt, if not suppressed.
   */
  notifyMessageRead(matchId: string, messageId: string, readerId: string) {
    this.server
      .to(`match_${matchId}`)
      .emit('message_read', { messageId, readerId });
  }
}
