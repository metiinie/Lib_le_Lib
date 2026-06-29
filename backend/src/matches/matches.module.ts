import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Swipe } from './entities/swipe.entity';
import { Match } from './entities/match.entity';
import { SwipesRepository } from './repositories/swipes.repository';
import { MatchesRepository } from './repositories/matches.repository';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { SafetyModule } from '../safety/safety.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Swipe, Match]),
    SafetyModule, // Provides BlocksRepository
  ],
  controllers: [MatchesController],
  providers: [
    SwipesRepository,
    MatchesRepository,
    MatchesService,
  ],
  exports: [MatchesService, MatchesRepository, SwipesRepository], // Exported for Discovery to use
})
export class MatchesModule {}
