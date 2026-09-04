import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import type { QaThread } from './qa-thread.entity';
import type { User } from '../../users/entities/user.entity';

@Index(['threadId', 'sentAt'])
@Entity('qa_messages')
export class QaMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'thread_id', type: 'uuid' })
  threadId: string;

  @ManyToOne('QaThread', (thread: any) => thread.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'thread_id' })
  thread: QaThread;

  @Column({ name: 'sender_id', type: 'uuid' })
  senderId: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column('text')
  content: string;

  @CreateDateColumn({ name: 'sent_at' })
  sentAt: Date;
}
