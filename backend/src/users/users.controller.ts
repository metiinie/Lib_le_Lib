import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UserRole } from './entities/user.entity';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile.' })
  @ApiResponse({ status: 200, description: 'User profile returned.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getMe(@CurrentUser() user: { id: string }) {
    return this.usersService.getMe(user.id);
  }

  @Get('admin/stats')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get overall admin platform stats (Admin only).' })
  async getAdminStats() {
    return this.usersService.getAdminStats();
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'List and search all users with role filtering (Admin only).' })
  async getUsers(
    @Query('limit') limitStr: string,
    @Query('offset') offsetStr: string,
    @Query('search') search: string,
    @Query('role') role: string,
  ) {
    const limit = parseInt(limitStr, 10) || 50;
    const offset = parseInt(offsetStr, 10) || 0;
    return this.usersService.getUsers(limit, offset, search, role as UserRole);
  }

  @Post('devices')
  @ApiOperation({
    summary: 'Register a device for push notifications and E2E keys.',
  })
  @ApiResponse({ status: 201, description: 'Device registered successfully.' })
  async registerDevice(
    @CurrentUser() user: { id: string },
    @Body() dto: RegisterDeviceDto,
  ) {
    return this.usersService.registerDevice(user.id, dto);
  }

  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({
    summary: 'Update a user staff role (Admin only).',
  })
  @ApiResponse({ status: 200, description: 'User role updated successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin role required.' })
  @ApiResponse({ status: 404, description: 'Target user not found.' })
  async updateUserRole(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) targetUserId: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateUserRole(user.id, targetUserId, dto);
  }
}
