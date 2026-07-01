import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Match } from '../../matches/entities/match.entity';

export enum ReportCategory {
  HARASSMENT = 'harassment',
  FAKE_PROFILE = 'fake_profile',
  OUTING_THREAT = 'outing_threat',
  SOLICITATION = 'solicitation',
  SCAM = 'scam',
  UNDERAGE_SUSPICION = 'underage_suspicion',
  OTHER = 'other',
}

export enum ReportStatus {
  OPEN = 'open',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

export enum ReportSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @Column({ name: 'reporter_id', type: 'uuid' })
  reporterId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reported_id' })
  reported: User;

  @Column({ name: 'reported_id', type: 'uuid' })
  reportedId: string;

  @ManyToOne(() => Match)
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @Column({ name: 'match_id', type: 'uuid', nullable: true })
  matchId: string;

  @Column({ type: 'enum', enum: ReportCategory, enumName: 'report_category' })
  category: ReportCategory;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'evidence_ref', type: 'text', nullable: true })
  evidenceRef: string;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    enumName: 'report_status',
    default: ReportStatus.OPEN,
  })
  status: ReportStatus;

  @Column({
    type: 'enum',
    enum: ReportSeverity,
    enumName: 'report_severity',
    default: ReportSeverity.LOW,
  })
  severity: ReportSeverity;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assigned_to' })
  assignedTo: User;

  @Column({ name: 'assigned_to', type: 'uuid', nullable: true })
  assignedToId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt: Date;
}
