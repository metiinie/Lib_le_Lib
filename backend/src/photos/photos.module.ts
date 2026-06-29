import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PhotosController } from './photos.controller';
import { PhotosService } from './photos.service';
import { PhotosRepository } from './repositories/photos.repository';
import { StorageService } from './storage.service';
import { Photo } from './entities/photo.entity';
import { PhotoRevealGrant } from './entities/photo-reveal-grant.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Photo, PhotoRevealGrant]),
  ],
  controllers: [PhotosController],
  providers: [PhotosService, PhotosRepository, StorageService],
  exports: [PhotosService, StorageService],
})
export class PhotosModule {}
