import { IsString, IsOptional, IsInt, Min, IsBoolean, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestUploadUrlDto {
  @ApiProperty({ example: 'image/jpeg', required: false })
  @IsString()
  @IsOptional()
  contentType?: string;

  @ApiProperty({ enum: ['document', 'selfie', 'profile'], required: false })
  @IsString()
  @IsOptional()
  @IsIn(['document', 'selfie', 'profile'])
  type?: string;
}

export class RegisterPhotoDto {
  @ApiProperty({
    description: 'The storage_ref key returned by /photos/upload-url',
  })
  @IsString()
  storageRef: string;

  @ApiProperty({ example: 0, required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  position?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

export class GrantRevealDto {
  @ApiProperty({ description: 'UUID of the user to grant reveal access to' })
  @IsString()
  viewerUserId: string;
}
