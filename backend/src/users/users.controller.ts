import { Controller, Get, Post, Body, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersRepository } from './repositories/users.repository';
import { DevicesRepository } from './repositories/devices.repository';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RegisterDeviceDto } from './dto/register-device.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly devicesRepository: DevicesRepository,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile.' })
  @ApiResponse({ status: 200, description: 'User profile returned.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getMe(@CurrentUser() user: { id: string }) {
    const profile = await this.usersRepository.findById(user.id);
    if (!profile) {
      throw new UnauthorizedException();
    }
    // Omit sensitive data before returning
    const { passwordHash, ...safeProfile } = profile;
    return safeProfile;
  }

  @Post('devices')
  @ApiOperation({ summary: 'Register a device for push notifications and E2E keys.' })
  @ApiResponse({ status: 201, description: 'Device registered successfully.' })
  async registerDevice(
    @CurrentUser() user: { id: string },
    @Body() dto: RegisterDeviceDto,
  ) {
    return this.devicesRepository.upsert({
      userId: user.id,
      platform: dto.platform,
      pushToken: dto.pushToken,
      publicKey: dto.publicKey,
    });
  }
}
