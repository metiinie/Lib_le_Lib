import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * OTP codes for phone/email verification.
 *
 * Maps to `public.otp_codes` table in lib-le-lib-schema.sql.
 * The `code_hash` column stores a bcrypt hash of the OTP — the
 * plaintext code is never persisted.
 */
@Entity('otp_codes')
export class OtpCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_otp_codes_destination')
  @Column({ type: 'text' })
  destination: string;

  @Column({ name: 'code_hash', type: 'text' })
  codeHash: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'smallint', default: 0 })
  attempts: number;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'consumed_at', type: 'timestamptz', nullable: true })
  consumedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  // ── Relations ──

  @ManyToOne(() => User, (user) => user.otpCodes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
