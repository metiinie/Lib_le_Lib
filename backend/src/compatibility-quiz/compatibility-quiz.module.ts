import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizQuestion } from './entities/quiz-question.entity';
import { QuizOption } from './entities/quiz-option.entity';
import { QuizResponse } from './entities/quiz-response.entity';
import { QuizRepository } from './repositories/quiz.repository';
import { CompatibilityQuizService } from './compatibility-quiz.service';
import { CompatibilityQuizController } from './compatibility-quiz.controller';

@Module({
  imports: [TypeOrmModule.forFeature([QuizQuestion, QuizOption, QuizResponse])],
  controllers: [CompatibilityQuizController],
  providers: [QuizRepository, CompatibilityQuizService],
  exports: [CompatibilityQuizService],
})
export class CompatibilityQuizModule {}
