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
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Region } from './region.entity';
import { InterestTag } from './interest-tag.entity';
import { Photo } from '../../photos/entities/photo.entity';

@Entity('profiles')
export class Profile {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'full_name', type: 'text', nullable: true })
  fullName: string | null;

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

  @Column({
    name: 'preferred_language',
    type: 'enum',
    enum: ['am', 'en'],
    enumName: 'profiles_preferred_language_enum',
    default: 'en',
  })
  preferredLanguage: string;

  @Column({
    name: 'looking_for',
    type: 'enum',
    enum: ['men', 'women', 'everyone'],
    array: true,
    default: ['everyone'],
  })
  lookingFor: string[];

  @Column({ name: 'virus_type', type: 'text', nullable: true })
  virusType: string;

  /**
   * When true, verified (active) members can see this user's photos
   * unblurred in discovery. When the owner toggles this to false,
   * their photos remain blurred for everyone.
   */
  @Column({
    name: 'photos_visible_to_verified',
    type: 'boolean',
    default: true,
  })
  photosVisibleToVerified: boolean;

  @OneToMany(() => Photo, (photo) => photo.profile)
  photos: Photo[];

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
