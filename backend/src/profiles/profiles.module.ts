import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { ProfilesRepository } from './repositories/profiles.repository';
import { Profile } from './entities/profile.entity';
import { Region } from './entities/region.entity';
import { InterestTag } from './entities/interest-tag.entity';

import { PhotosModule } from '../photos/photos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Profile, Region, InterestTag]),
    PhotosModule,
  ],
  controllers: [ProfilesController],
  providers: [ProfilesService, ProfilesRepository],
  exports: [ProfilesService, ProfilesRepository],
})
export class ProfilesModule { }
