import { Injectable, NotFoundException } from '@nestjs/common';
import { VideoCallsRepository } from './repositories/video-calls.repository';
import {
  VideoVerificationCall,
  VideoCallStatus,
} from './entities/video-verification-call.entity';
import { MatchesService } from '../matches/matches.service';

@Injectable()
export class VideoCallsService {
  constructor(
    private readonly videoCallsRepository: VideoCallsRepository,
    private readonly matchesService: MatchesService,
  ) {}

  async scheduleCall(
    matchId: string,
    initiatorId: string,
    scheduledAt: Date,
  ): Promise<VideoVerificationCall> {
    await this.matchesService.validateMatchMembership(matchId, initiatorId);

    const call = this.videoCallsRepository.createCall({
      matchId,
      initiatedById: initiatorId,
      status: VideoCallStatus.SCHEDULED,
      scheduledAt,
    });

    return this.videoCallsRepository.saveCall(call);
  }

  async updateStatus(
    matchId: string,
    callId: string,
    userId: string,
    status: VideoCallStatus,
  ): Promise<VideoVerificationCall> {
    await this.matchesService.validateMatchMembership(matchId, userId);

    const call = await this.videoCallsRepository.findByIdAndMatchId(
      callId,
      matchId,
    );

    if (!call) {
      throw new NotFoundException('Video call not found');
    }

    call.status = status;
    if (status === VideoCallStatus.COMPLETED) {
      call.completedAt = new Date();
    }

    return this.videoCallsRepository.saveCall(call);
  }
}
