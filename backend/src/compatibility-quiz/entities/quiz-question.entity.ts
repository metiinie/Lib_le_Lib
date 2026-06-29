import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { QuizOption } from './quiz-option.entity';

@Entity('compatibility_quiz_questions')
export class QuizQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'question_text', type: 'text' })
  questionText: string;

  @Column({
    name: 'question_type',
    type: 'enum',
    enum: ['single_choice', 'multi_choice', 'scale', 'free_text'],
    enumName: 'quiz_question_type',
  })
  questionType: string;

  @Column({ name: 'order_index', type: 'smallint', default: 0 })
  orderIndex: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @OneToMany(() => QuizOption, (option) => option.question)
  options: QuizOption[];
}
