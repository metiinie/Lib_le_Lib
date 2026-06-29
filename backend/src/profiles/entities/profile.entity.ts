import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  OneToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Region } from './region.entity';
import { InterestTag } from './interest-tag.entity';

@Entity('profiles')
export class Profile {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text' })
  nickname: string;

  @Column({ name: 'date_of_birth', type: 'date' })
  dateOfBirth: string;

  @Column({ type: 'enum', enum: ['man', 'woman', 'other'] })
  gender: string;

  @ManyToOne(() => Region)
  @JoinColumn({ name: 'region_id' })
  region: Region;

  @Column({ name: 'region_id', type: 'uuid', nullable: true })
  regionId: string;

  @Column({
    name: 'relationship_goals',
    type: 'enum',
    enum: ['marriage', 'serious_relationship', 'friendship'],
    array: true,
    default: [],
  })
  relationshipGoals: string[];

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ name: 'discreet_mode', type: 'boolean', default: false })
  discreetMode: boolean;

  @Column({ name: 'low_bandwidth_mode', type: 'boolean', default: false })
  lowBandwidthMode: boolean;

  @Column({ name: 'preferred_language', type: 'enum', enum: ['am', 'en'], default: 'en' })
  preferredLanguage: string;

  @ManyToMany(() => InterestTag)
  @JoinTable({
    name: 'profile_interest_tags',
    joinColumn: { name: 'profile_id', referencedColumnName: 'userId' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  interestTags: InterestTag[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
