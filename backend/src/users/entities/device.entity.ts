import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

/**
 * Registered devices for push notifications and E2E key exchange.
 *
 * Maps to `public.devices` table in lib-le-lib-schema.sql.
 */
@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_devices_user_id')
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'push_token', type: 'text', nullable: true })
  pushToken: string | null;

  /** 'ios' | 'android' */
  @Column({ type: 'text' })
  platform: string;

  /** E2E key-exchange public key for this device. */
  @Column({ name: 'public_key', type: 'text', nullable: true })
  publicKey: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'last_seen_at', type: 'timestamptz', default: () => 'now()' })
  lastSeenAt: Date;

  // ── Relations ──

  @ManyToOne(() => User, (user) => user.devices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
