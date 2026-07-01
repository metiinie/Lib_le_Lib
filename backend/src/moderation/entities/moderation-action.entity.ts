import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Report } from './report.entity';

export enum ModerationActionType {
  WARN = 'warn',
  SUSPEND = 'suspend',
  BAN = 'ban',
  REQUEST_RESUBMISSION = 'request_resubmission',
  NONE = 'none',
}

@Entity('moderation_actions')
export class ModerationAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Report)
  @JoinColumn({ name: 'report_id' })
  report: Report;

  @Column({ name: 'report_id', type: 'uuid', nullable: true })
  reportId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'target_user_id' })
  targetUser: User;

  @Column({ name: 'target_user_id', type: 'uuid' })
  targetUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'actor_id' })
  actor: User;

  @Column({ name: 'actor_id', type: 'uuid' })
  actorId: string;

  @Column({
    type: 'enum',
    enum: ModerationActionType,
    enumName: 'moderation_action_type',
  })
  action: ModerationActionType;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date;
}
