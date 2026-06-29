import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { QuizQuestion } from './quiz-question.entity';
import { QuizOption } from './quiz-option.entity';
import { Profile } from '../../profiles/entities/profile.entity';

@Entity('compatibility_quiz_responses')
export class QuizResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;

  @Column({ name: 'profile_id', type: 'uuid' })
  profileId: string;

  @ManyToOne(() => QuizQuestion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: QuizQuestion;

  @Column({ name: 'question_id', type: 'uuid' })
  questionId: string;

  @Column({ name: 'response_text', type: 'text', nullable: true })
  responseText: string;

  @Column({ name: 'response_numeric', type: 'numeric', nullable: true })
  responseNumeric: number;

  @CreateDateColumn({ name: 'answered_at', type: 'timestamptz' })
  answeredAt: Date;

  @ManyToMany(() => QuizOption)
  @JoinTable({
    name: 'compatibility_quiz_response_options',
    joinColumn: { name: 'response_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'option_id', referencedColumnName: 'id' },
  })
  options: QuizOption[];
}
