import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SuccessStoriesService } from './success-stories.service';
import { CreateSuccessStoryDto } from './dto/create-success-story.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('success-stories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('success-stories')
export class SuccessStoriesController {
  constructor(private readonly successStoriesService: SuccessStoriesService) {}

  @Get()
  async getPublishedStories(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.successStoriesService.getPublishedStories(limit, offset);
  }

  @Post()
  async submitStory(@Request() req, @Body() createDto: CreateSuccessStoryDto) {
    await this.successStoriesService.submitStory(req.user.id, createDto);
    return { success: true, message: 'Story submitted for review.' };
  }

  @Post(':id/approve')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async approveStory(@Request() req, @Param('id') id: string) {
    await this.successStoriesService.approveStory(id, req.user.id);
    return { success: true, message: 'Story approved and published.' };
  }
}
