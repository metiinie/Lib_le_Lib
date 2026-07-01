import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Device } from './entities/device.entity';
import { UsersRepository } from './repositories/users.repository';
import { DevicesRepository } from './repositories/devices.repository';
import { UsersController } from './users.controller';

import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Device])],
  controllers: [UsersController],
  providers: [UsersRepository, DevicesRepository, UsersService],
  exports: [UsersRepository, DevicesRepository, UsersService], // Exported for use in AuthModule
})
export class UsersModule {}
