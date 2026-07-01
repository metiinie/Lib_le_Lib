import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'actor_id' })
  actor: User;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId: string; // nullable because system actions don't have an actor

  @Column({
    name: 'actor_role',
    type: 'enum',
    enum: [
      'member',
      'verification_officer',
      'moderator',
      'admin',
      'health_professional',
    ],
    nullable: true,
  })
  actorRole: string;

  @Column({ type: 'text' })
  action: string;

  @Column({ name: 'target_type', type: 'text' })
  targetType: string;

  @Column({ name: 'target_id', type: 'uuid', nullable: true })
  targetId: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
