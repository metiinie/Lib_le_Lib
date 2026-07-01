import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersRepository } from './repositories/users.repository';
import { DevicesRepository } from './repositories/devices.repository';
import { RegisterDeviceDto } from './dto/register-device.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly devicesRepository: DevicesRepository,
  ) {}

  async getMe(userId: string) {
    const profile = await this.usersRepository.findById(userId);
    if (!profile) {
      throw new UnauthorizedException({
        error: { code: 'USER_NOT_FOUND', message: 'User not found.' },
      });
    }
    // Omit sensitive data before returning
    const { passwordHash, ...safeProfile } = profile;
    return safeProfile;
  }

  async registerDevice(userId: string, dto: RegisterDeviceDto) {
    return this.devicesRepository.upsert({
      userId,
      platform: dto.platform,
      pushToken: dto.pushToken,
      publicKey: dto.publicKey,
    });
  }
}
