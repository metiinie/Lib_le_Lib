import { Injectable, NotFoundException } from '@nestjs/common';
import { SuccessStoriesRepository } from './repositories/success-stories.repository';
import { CreateSuccessStoryDto } from './dto/create-success-story.dto';
import { SuccessStoryResponseDto } from './dto/success-story-response.dto';

@Injectable()
export class SuccessStoriesService {
  constructor(
    private readonly successStoriesRepository: SuccessStoriesRepository,
  ) {}

  async getPublishedStories(
    limit = 20,
    offset = 0,
  ): Promise<SuccessStoryResponseDto[]> {
    const stories = await this.successStoriesRepository.findPublished(
      limit,
      offset,
    );

    return stories.map(
      (story) =>
        new SuccessStoryResponseDto({
          id: story.id,
          title: story.title,
          storyText: story.storyText,
          publishedAt: story.publishedAt,
        }),
    );
  }

  async submitStory(
    userId: string,
    createDto: CreateSuccessStoryDto,
  ): Promise<void> {
    await this.successStoriesRepository.createStory(userId, createDto);
  }

  async approveStory(id: string, adminUserId: string): Promise<void> {
    const story = await this.successStoriesRepository.findById(id);
    if (!story) {
      throw new NotFoundException('Success story not found');
    }

    story.published = true;
    story.publishedAt = new Date();
    story.approvedByUserId = adminUserId;

    await this.successStoriesRepository.saveStory(story);
  }
}
