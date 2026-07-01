import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Message } from './message.entity';

@Entity('message_attachments')
export class MessageAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Message, (message) => message.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'message_id' })
  message: Message;

  @Column({ name: 'message_id', type: 'uuid' })
  messageId: string;

  @Column({ name: 'storage_ref', type: 'text' })
  storageRef: string;

  @Column({ name: 'blurred_default', type: 'boolean', default: true })
  blurredDefault: boolean;

  @Column({ name: 'revealed_at', type: 'timestamptz', nullable: true })
  revealedAt: Date | null;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null;
}
