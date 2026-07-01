import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { VideoVerificationCall } from '../entities/video-verification-call.entity';

@Injectable()
export class VideoCallsRepository {
  private readonly repo: Repository<VideoVerificationCall>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(VideoVerificationCall);
  }

  createCall(data: Partial<VideoVerificationCall>): VideoVerificationCall {
    return this.repo.create(data);
  }

  async findByIdAndMatchId(
    id: string,
    matchId: string,
  ): Promise<VideoVerificationCall | null> {
    return this.repo.findOne({ where: { id, matchId } });
  }

  async saveCall(call: VideoVerificationCall): Promise<VideoVerificationCall> {
    return this.repo.save(call);
  }
}
