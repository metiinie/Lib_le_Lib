import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('interest_tags')
export class InterestTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  name: string;
}
