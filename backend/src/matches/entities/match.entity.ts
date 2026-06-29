import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_a_id' })
  userA: User;

  @Column({ name: 'user_a_id', type: 'uuid' })
  userAId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_b_id' })
  userB: User;

  @Column({ name: 'user_b_id', type: 'uuid' })
  userBId: string;

  @Column({
    type: 'enum',
    enum: ['active', 'unmatched'],
    enumName: 'match_status',
    default: 'active',
  })
  status: string;

  @CreateDateColumn({ name: 'matched_at', type: 'timestamptz' })
  matchedAt: Date;

  @Column({ name: 'unmatched_at', type: 'timestamptz', nullable: true })
  unmatchedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'unmatched_by' })
  unmatchedBy: User;

  @Column({ name: 'unmatched_by', type: 'uuid', nullable: true })
  unmatchedById: string;
}
