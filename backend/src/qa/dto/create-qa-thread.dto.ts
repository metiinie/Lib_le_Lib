import { IsString, IsNotEmpty } from 'class-validator';

export class CreateQaThreadDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}
