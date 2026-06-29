import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Block } from './entities/block.entity';
import { BlocksRepository } from './repositories/blocks.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Block])],
  providers: [BlocksRepository],
  exports: [BlocksRepository], // Exported for Discovery and Matches to use
})
export class SafetyModule {}
