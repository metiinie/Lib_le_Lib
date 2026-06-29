import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('verification_records', { schema: 'verification' })
export class VerificationRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({
    type: 'enum',
    enum: ['self_upload', 'telehealth'],
    default: 'self_upload',
  })
  method: string;

  @Column({
    type: 'enum',
    enum: ['submitted', 'in_review', 'approved', 'rejected', 'expired'],
    default: 'submitted',
  })
  status: string;

  @Column({ name: 'submitted_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  submittedAt: Date;

  @Column({ name: 'decision_at', type: 'timestamptz', nullable: true })
  decisionAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User;

  @Column({ name: 'reviewer_id', type: 'uuid', nullable: true })
  reviewerId: string;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate: string; // TypeORM maps Postgres DATE to string by default unless transformed

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
