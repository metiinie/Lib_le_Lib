import { Injectable } from '@nestjs/common';
import { DataSource, Repository, In } from 'typeorm';
import { QuizQuestion } from '../entities/quiz-question.entity';
import { QuizResponse } from '../entities/quiz-response.entity';
import { QuizOption } from '../entities/quiz-option.entity';
import { SubmitResponseDto } from '../dto/submit-response.dto';

@Injectable()
export class QuizRepository {
  private readonly questionRepo: Repository<QuizQuestion>;
  private readonly responseRepo: Repository<QuizResponse>;
  private readonly optionRepo: Repository<QuizOption>;

  constructor(private readonly dataSource: DataSource) {
    this.questionRepo = this.dataSource.getRepository(QuizQuestion);
    this.responseRepo = this.dataSource.getRepository(QuizResponse);
    this.optionRepo = this.dataSource.getRepository(QuizOption);
  }

  async getActiveQuestions(): Promise<QuizQuestion[]> {
    return this.questionRepo.find({
      where: { active: true },
      relations: ['options'],
      order: { orderIndex: 'ASC', options: { orderIndex: 'ASC' } },
    });
  }

  async saveResponse(
    userId: string,
    dto: SubmitResponseDto,
  ): Promise<QuizResponse> {
    // We treat profile_id as user_id because they share the same ID.
    // Ensure existing responses are overwritten or handle uniqueness.
    // The DB constraint UNIQUE (profile_id, question_id) means we should update or delete first.

    await this.responseRepo.delete({
      profileId: userId,
      questionId: dto.questionId,
    });

    const response = this.responseRepo.create({
      profileId: userId,
      questionId: dto.questionId,
      responseText: dto.responseText,
      responseNumeric: dto.responseNumeric,
    });

    if (dto.optionIds && dto.optionIds.length > 0) {
      const options = await this.optionRepo.find({
        where: { id: In(dto.optionIds) },
      });
      response.options = options;
    }

    return this.responseRepo.save(response);
  }

  // Helper for tests to seed data
  async seedQuestions() {
    const count = await this.questionRepo.count();
    if (count > 0) return;

    const q1 = this.questionRepo.create({
      questionText: 'What are you looking for?',
      questionType: 'single_choice',
      orderIndex: 1,
    });
    const savedQ1 = await this.questionRepo.save(q1);

    await this.optionRepo.save([
      {
        questionId: savedQ1.id,
        optionText: 'Serious Relationship',
        orderIndex: 1,
      },
      { questionId: savedQ1.id, optionText: 'Friendship', orderIndex: 2 },
    ]);

    const q2 = this.questionRepo.create({
      questionText: 'Which activities do you enjoy?',
      questionType: 'multi_choice',
      orderIndex: 2,
    });
    const savedQ2 = await this.questionRepo.save(q2);

    await this.optionRepo.save([
      { questionId: savedQ2.id, optionText: 'Hiking', orderIndex: 1 },
      { questionId: savedQ2.id, optionText: 'Reading', orderIndex: 2 },
      { questionId: savedQ2.id, optionText: 'Cooking', orderIndex: 3 },
      { questionId: savedQ2.id, optionText: 'Traveling', orderIndex: 4 },
    ]);

    const q3 = this.questionRepo.create({
      questionText: 'How important is regular communication to you?',
      questionType: 'scale',
      orderIndex: 3,
    });
    await this.questionRepo.save(q3); // Scale doesn't strictly need options, client can render 1-10

    const q4 = this.questionRepo.create({
      questionText: 'What is your ideal first date?',
      questionType: 'free_text',
      orderIndex: 4,
    });
    await this.questionRepo.save(q4);
  }
}
