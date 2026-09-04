import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import type { Match } from '../../matches/entities/match.entity';
import type { User } from '../../users/entities/user.entity';

export enum VideoCallStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
}

@Entity('video_verification_calls')
export class VideoVerificationCall {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne('Match', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @Column({ name: 'match_id', type: 'uuid' })
  matchId: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'initiated_by' })
  initiatedBy: User;

  @Column({ name: 'initiated_by', type: 'uuid' })
  initiatedById: string;

  @Column({
    type: 'enum',
    enum: VideoCallStatus,
    enumName: 'video_call_status',
    default: VideoCallStatus.SCHEDULED,
  })
  status: VideoCallStatus;

  @Column({ name: 'scheduled_at', type: 'timestamptz', nullable: true })
  scheduledAt: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date;
}
