import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('success_stories')
export class SuccessStory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'submitted_by_user_id', type: 'uuid', nullable: true })
  submittedByUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'submitted_by_user_id' })
  submittedBy: User;

  @Column()
  title: string;

  @Column('text', { name: 'story_text' })
  storyText: string;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedByUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approved_by' })
  approvedBy: User;

  @Column({ default: false })
  published: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date;
}
