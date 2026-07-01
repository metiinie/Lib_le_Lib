import { IsUUID, IsNotEmpty } from 'class-validator';

export class BlockUserDto {
  @IsUUID()
  @IsNotEmpty()
  blockedId: string;
}
