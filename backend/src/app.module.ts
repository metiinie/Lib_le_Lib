import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppDataSource } from './config/typeorm.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { PhotosModule } from './photos/photos.module';
import { DiscoveryModule } from './discovery/discovery.module';
import { MatchesModule } from './matches/matches.module';
import { MessagesModule } from './messages/messages.module';
import { SafetyModule } from './safety/safety.module';
import { VerificationModule } from './verification/verification.module';
import { ResourcesModule } from './resources/resources.module';
import { QaModule } from './qa/qa.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { CompatibilityQuizModule } from './compatibility-quiz/compatibility-quiz.module';
import { VideoCallsModule } from './video-calls/video-calls.module';
import { ModerationModule } from './moderation/moderation.module';
import { SuccessStoriesModule } from './success-stories/success-stories.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100, // Default 100 requests per minute
        skipIf: () => process.env.NODE_ENV === 'test',
      },
    ]),
    TypeOrmModule.forRoot({
      ...AppDataSource.options,
      autoLoadEntities: true,
    }),
    ScheduleModule.forRoot(),
    LoggerModule.forRoot({
      pinoHttp: {
        autoLogging: process.env.NODE_ENV !== 'test',
        level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
        redact: {
          paths: [
            'req.headers.authorization',
            'req.body.phone',
            'req.body.email',
            'req.body.password',
            'req.body.passwordHash',
            'req.body.ciphertext',
            'req.body.nonce',
            'req.body.storageRef',
            'req.body.selfieStorageRef',
            'req.body.storyText',
            'req.body.body',
            'req.body.content',
            'res.body.phone',
            'res.body.email',
            'res.body.password',
            'res.body.passwordHash',
            'res.body.ciphertext',
            'res.body.nonce',
            'res.body.storageRef',
            'res.body.selfieStorageRef',
            'res.body.storyText',
            'res.body.body',
            'res.body.content',
          ],
          censor: '[REDACTED]',
        },
        transport:
          process.env.NODE_ENV !== 'production' &&
          process.env.NODE_ENV !== 'test'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
      },
    }),
    AuthModule,
    UsersModule,
    ProfilesModule,
    PhotosModule,
    DiscoveryModule,
    MatchesModule,
    MessagesModule,
    SafetyModule,
    VerificationModule,
    ResourcesModule,
    QaModule,
    SubscriptionsModule,
    CompatibilityQuizModule,
    VideoCallsModule,
    ModerationModule,
    SuccessStoriesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
