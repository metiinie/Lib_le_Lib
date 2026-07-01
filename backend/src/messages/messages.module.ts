import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { Message } from './entities/message.entity';
import { MessageAttachment } from './entities/message-attachment.entity';
import { Device } from '../users/entities/device.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { PhotosModule } from '../photos/photos.module';
import { SafetyModule } from '../safety/safety.module';
import { MatchesModule } from '../matches/matches.module';

import { MessagesRepository } from './repositories/messages.repository';
import { MessageAttachmentsRepository } from './repositories/message-attachments.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, MessageAttachment, Device, Profile]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
    PhotosModule, // For StorageService
    SafetyModule,
    MatchesModule,
  ],
  controllers: [MessagesController],
  providers: [
    MessagesService,
    MessagesGateway,
    MessagesRepository,
    MessageAttachmentsRepository,
  ],
})
export class MessagesModule {}
