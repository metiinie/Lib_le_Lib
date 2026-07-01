import { Controller, Get, Post, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('profiles')
@Controller()
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('regions')
  @ApiResponse({ status: 200, description: 'List of all regions.' })
  async getRegions() {
    return this.profilesService.getRegions();
  }

  @Get('interest-tags')
  @ApiResponse({ status: 200, description: 'List of all interest tags.' })
  async getInterestTags() {
    return this.profilesService.getInterestTags();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('profiles/me')
  @ApiResponse({
    status: 200,
    description: 'Returns the current user profile.',
  })
  @ApiResponse({ status: 404, description: 'Profile not found.' })
  async getMyProfile(@CurrentUser() user: { id: string }) {
    return this.profilesService.getProfile(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('profiles/me')
  @ApiResponse({ status: 201, description: 'Profile created.' })
  @ApiResponse({ status: 409, description: 'Profile already exists.' })
  @ApiResponse({ status: 400, description: 'Underage.' })
  async createMyProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateProfileDto,
  ) {
    return this.profilesService.createProfile(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('profiles/me')
  @ApiResponse({ status: 200, description: 'Profile updated.' })
  async updateMyProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profilesService.updateProfile(user.id, dto);
  }
}
