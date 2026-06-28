import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../entities/device.entity';

/**
 * Repository for the `devices` table.
 *
 * Per patterns.md: every table has exactly one repository.
 */
@Injectable()
export class DevicesRepository {
  constructor(
    @InjectRepository(Device)
    private readonly repo: Repository<Device>,
  ) {}

  async create(data: Partial<Device>): Promise<Device> {
    const device = this.repo.create(data);
    return this.repo.save(device);
  }

  async findByUserAndPlatform(
    userId: string,
    platform: string,
  ): Promise<Device | null> {
    return this.repo.findOne({ where: { userId, platform } });
  }

  async findByUserId(userId: string): Promise<Device[]> {
    return this.repo.find({ where: { userId } });
  }

  /**
   * Upserts a device: updates push token / public key if a device
   * for this user+platform already exists, otherwise creates one.
   */
  async upsert(data: Partial<Device>): Promise<Device> {
    const existing = await this.findByUserAndPlatform(
      data.userId!,
      data.platform!,
    );
    if (existing) {
      Object.assign(existing, {
        pushToken: data.pushToken ?? existing.pushToken,
        publicKey: data.publicKey ?? existing.publicKey,
        lastSeenAt: new Date(),
      });
      return this.repo.save(existing);
    }
    return this.create(data);
  }
}
