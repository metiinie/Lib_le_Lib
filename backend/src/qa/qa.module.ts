import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QaService } from './qa.service';
import { QaController } from './qa.controller';
import { QaThread } from './entities/qa-thread.entity';
import { QaMessage } from './entities/qa-message.entity';

import { QaThreadsRepository } from './repositories/qa-threads.repository';
import { QaMessagesRepository } from './repositories/qa-messages.repository';

@Module({
  imports: [TypeOrmModule.forFeature([QaThread, QaMessage])],
  controllers: [QaController],
  providers: [QaService, QaThreadsRepository, QaMessagesRepository],
})
export class QaModule {}
