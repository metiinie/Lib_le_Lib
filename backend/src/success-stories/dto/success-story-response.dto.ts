import { Exclude, Expose } from 'class-transformer';

export class SuccessStoryResponseDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  storyText: string;

  @Expose()
  publishedAt: Date;

  // We strictly do NOT expose submitted_by_user_id
  @Exclude()
  submittedByUserId?: string;

  constructor(partial: Partial<SuccessStoryResponseDto>) {
    Object.assign(this, partial);
  }
}
