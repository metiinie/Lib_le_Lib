import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ResourceCategory {
  TREATMENT_INFO = 'treatment_info',
  U_EQUALS_U = 'u_equals_u',
  HOTLINE = 'hotline',
  GENERAL = 'general',
}

export enum LanguageCode {
  AM = 'am',
  EN = 'en',
}

@Entity('resources')
export class Resource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  body: string;

  @Column({
    type: 'enum',
    enum: ResourceCategory,
  })
  category: ResourceCategory;

  @Column({
    type: 'enum',
    enum: LanguageCode,
    default: LanguageCode.EN,
  })
  language: LanguageCode;

  @Column({ default: false })
  published: boolean;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdByUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
