import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModerationModule } from '../moderation/moderation.module';
import { Block } from './entities/block.entity';
import { BlocksRepository } from './repositories/blocks.repository';
import { SafetyService } from './safety.service';
import { SafetyController } from './safety.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Block]), ModerationModule],
  controllers: [SafetyController],
  providers: [BlocksRepository, SafetyService],
  exports: [BlocksRepository], // Exported for Discovery and Matches to use
})
export class SafetyModule {}
