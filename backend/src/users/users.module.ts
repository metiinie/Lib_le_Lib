import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Device } from './entities/device.entity';
import { UsersRepository } from './repositories/users.repository';
import { DevicesRepository } from './repositories/devices.repository';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ModerationModule } from '../moderation/moderation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Device]),
    ModerationModule,
  ],
  controllers: [UsersController],
  providers: [UsersRepository, DevicesRepository, UsersService],
  exports: [UsersRepository, DevicesRepository, UsersService], // Exported for use in AuthModule
})
export class UsersModule {}
