import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Photo } from './photo.entity';
import { User } from '../../users/entities/user.entity';

@Entity('photo_reveal_grants')
export class PhotoRevealGrant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Photo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'photo_id' })
  photo: Photo;

  @Column({ name: 'photo_id', type: 'uuid' })
  photoId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'granted_to_user_id' })
  grantedToUser: User;

  @Column({ name: 'granted_to_user_id', type: 'uuid' })
  grantedToUserId: string;

  @Column({ name: 'match_id', type: 'uuid', nullable: true })
  matchId: string;

  @CreateDateColumn({ name: 'granted_at', type: 'timestamptz' })
  grantedAt: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date;
}
