import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { SuccessStory } from '../entities/success-story.entity';
import { CreateSuccessStoryDto } from '../dto/create-success-story.dto';

@Injectable()
export class SuccessStoriesRepository {
  private readonly repo: Repository<SuccessStory>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(SuccessStory);
  }

  async findPublished(limit: number, offset: number): Promise<SuccessStory[]> {
    return this.repo.find({
      where: { published: true },
      order: { publishedAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async createStory(
    userId: string,
    createDto: CreateSuccessStoryDto,
  ): Promise<SuccessStory> {
    const story = this.repo.create({
      ...createDto,
      submittedByUserId: userId,
      published: false,
    });
    return this.repo.save(story);
  }

  async findById(id: string): Promise<SuccessStory | null> {
    return this.repo.findOne({ where: { id } });
  }

  async saveStory(story: SuccessStory): Promise<SuccessStory> {
    return this.repo.save(story);
  }
}
