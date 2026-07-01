import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { QuizQuestion } from './quiz-question.entity';

@Entity('compatibility_quiz_options')
export class QuizOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => QuizQuestion, (question) => question.options, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'question_id' })
  question: QuizQuestion;

  @Column({ name: 'question_id', type: 'uuid' })
  questionId: string;

  @Column({ name: 'option_text', type: 'text' })
  optionText: string;

  @Column({ name: 'order_index', type: 'smallint', default: 0 })
  orderIndex: number;
}
