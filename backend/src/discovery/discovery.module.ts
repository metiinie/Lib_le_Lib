import { Module } from '@nestjs/common';
import { DiscoveryService } from './discovery.service';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryRepository } from './repositories/discovery.repository';
import { SafetyModule } from '../safety/safety.module';
import { MatchesModule } from '../matches/matches.module';
import { PhotosModule } from '../photos/photos.module';

@Module({
  imports: [SafetyModule, MatchesModule, PhotosModule],
  controllers: [DiscoveryController],
  providers: [DiscoveryService, DiscoveryRepository],
})
export class DiscoveryModule { }
