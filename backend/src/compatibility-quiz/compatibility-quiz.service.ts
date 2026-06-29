import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { QuizRepository } from './repositories/quiz.repository';
import { SubmitResponseDto } from './dto/submit-response.dto';

@Injectable()
export class CompatibilityQuizService implements OnModuleInit {
  private readonly logger = new Logger(CompatibilityQuizService.name);

  constructor(private readonly quizRepo: QuizRepository) {}

  async onModuleInit() {
    try {
      await this.quizRepo.seedQuestions();
      this.logger.log('Seeded compatibility quiz questions');
    } catch (err) {
      this.logger.error('Failed to seed quiz questions', err);
    }
  }

  async getQuestions() {
    return this.quizRepo.getActiveQuestions();
  }

  async submitResponse(userId: string, dto: SubmitResponseDto) {
    return this.quizRepo.saveResponse(userId, dto);
  }
}
