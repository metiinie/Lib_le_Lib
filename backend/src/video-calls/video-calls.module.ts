import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoCallsController } from './video-calls.controller';
import { VideoCallsService } from './video-calls.service';
import { VideoVerificationCall } from './entities/video-verification-call.entity';
import { MatchesModule } from '../matches/matches.module';

import { VideoCallsRepository } from './repositories/video-calls.repository';

@Module({
  imports: [TypeOrmModule.forFeature([VideoVerificationCall]), MatchesModule],
  controllers: [VideoCallsController],
  providers: [VideoCallsService, VideoCallsRepository],
})
export class VideoCallsModule {}
