import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { OtpCode } from '../../auth/entities/otp-code.entity';
import { Device } from '../../users/entities/device.entity';

/**
 * Core auth identity. No legal name field by design (doc 4.2).
 *
 * Maps to `public.users` table in lib-le-lib-schema.sql.
 * The `chk_users_has_contact` constraint ensures at least one of
 * phone or email is non-null.
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true, nullable: true })
  phone: string | null;

  @Column({ type: 'text', unique: true, nullable: true })
  email: string | null;

  @Column({ name: 'password_hash', type: 'text', nullable: true })
  passwordHash: string | null;

  @Column({
    type: 'enum',
    enum: [
      'member',
      'verification_officer',
      'moderator',
      'admin',
      'health_professional',
    ],
    default: 'member',
  })
  role:
    | 'member'
    | 'verification_officer'
    | 'moderator'
    | 'admin'
    | 'health_professional';

  @Column({
    type: 'enum',
    enum: ['pending_verification', 'active', 'suspended', 'banned', 'deleted'],
    default: 'pending_verification',
  })
  status:
    | 'pending_verification'
    | 'active'
    | 'suspended'
    | 'banned'
    | 'deleted';

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  // ── Relations ──

  @OneToMany(() => OtpCode, (otp) => otp.user)
  otpCodes: OtpCode[];

  @OneToMany(() => Device, (device) => device.user)
  devices: Device[];
}
