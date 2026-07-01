import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateSuccessStoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @IsString()
  @IsNotEmpty()
  storyText: string;
}
