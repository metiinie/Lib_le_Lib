import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UsersRepository } from './repositories/users.repository';
import { DevicesRepository } from './repositories/devices.repository';
import { AuditLogsService } from '../moderation/audit-logs.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly devicesRepository: DevicesRepository,
    private readonly auditLogsService: AuditLogsService,
    private readonly dataSource: DataSource,
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

  async getUsers(limit = 50, offset = 0, search?: string, role?: UserRole) {
    const [users, total] = await this.usersRepository.findAll(limit, offset, search, role);
    const safeUsers = users.map((u) => {
      const { passwordHash, ...safe } = u;
      return safe;
    });
    return { data: safeUsers, total, limit, offset };
  }

  async getAdminStats() {
    const [
      totalUsers,
      memberCount,
      verificationOfficerCount,
      moderatorCount,
      healthProfessionalCount,
      adminCount,
    ] = await Promise.all([
      this.usersRepository.countTotal(),
      this.usersRepository.countByRole('member'),
      this.usersRepository.countByRole('verification_officer'),
      this.usersRepository.countByRole('moderator'),
      this.usersRepository.countByRole('health_professional'),
      this.usersRepository.countByRole('admin'),
    ]);

    return {
      totalUsers,
      roles: {
        member: memberCount,
        verification_officer: verificationOfficerCount,
        moderator: moderatorCount,
        health_professional: healthProfessionalCount,
        admin: adminCount,
      },
    };
  }

  async updateUserRole(
    adminUserId: string,
    targetUserId: string,
    dto: UpdateUserRoleDto,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const targetUser = await manager.findOne(User, {
        where: { id: targetUserId },
      });

      if (!targetUser) {
        throw new NotFoundException({
          error: { code: 'USER_NOT_FOUND', message: 'Target user not found.' },
        });
      }

      const previousRole = targetUser.role;
      targetUser.role = dto.role;
      await manager.save(targetUser);

      // Audit log for role promotion/change
      await this.auditLogsService.logAction(manager, {
        actorId: adminUserId,
        actorRole: 'admin',
        action: 'user_role_updated',
        targetType: 'user',
        targetId: targetUserId,
        metadata: { previousRole, newRole: dto.role },
      });

      return {
        id: targetUser.id,
        role: targetUser.role,
        updatedAt: targetUser.updatedAt,
      };
    });
  }
}
