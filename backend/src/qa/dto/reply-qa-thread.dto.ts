import { IsString, IsNotEmpty } from 'class-validator';

export class ReplyQaThreadDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}
