import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { VerificationRecord } from './verification-record.entity';
import { User } from '../../users/entities/user.entity';

@Entity('liveness_checks', { schema: 'verification' })
export class LivenessCheck {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => VerificationRecord, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'verification_record_id' })
  verificationRecord: VerificationRecord;

  @Column({ name: 'verification_record_id', type: 'uuid' })
  verificationRecordId: string;

  @Column({ name: 'selfie_storage_ref', type: 'text', nullable: true })
  selfieStorageRef: string;

  @Column({
    type: 'enum',
    enum: ['pass', 'fail', 'manual_review'],
    default: 'manual_review',
  })
  result: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewed_by' })
  reviewer: User;

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewerId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
