import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { QaMessage } from './qa-message.entity';

export enum QaThreadStatus {
  OPEN = 'open',
  ANSWERED = 'answered',
  CLOSED = 'closed',
}

@Entity('qa_threads')
export class QaThread {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'member_id', type: 'uuid' })
  memberId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'member_id' })
  member: User;

  @Column({ name: 'health_professional_id', type: 'uuid', nullable: true })
  healthProfessionalId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'health_professional_id' })
  healthProfessional: User;

  @Column({
    type: 'enum',
    enum: QaThreadStatus,
    default: QaThreadStatus.OPEN,
  })
  status: QaThreadStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt: Date;

  @OneToMany(() => QaMessage, (message) => message.thread)
  messages: QaMessage[];
}
