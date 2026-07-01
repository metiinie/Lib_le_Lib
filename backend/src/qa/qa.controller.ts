import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { QaService } from './qa.service';
import { CreateQaThreadDto } from './dto/create-qa-thread.dto';
import { ReplyQaThreadDto } from './dto/reply-qa-thread.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('qa')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('qa/threads')
export class QaController {
  constructor(private readonly qaService: QaService) {}

  @Get()
  async getThreads(@Request() req) {
    if (req.user.role === 'health_professional') {
      return this.qaService.getProfessionalThreads(req.user.id);
    }
    // Only return the member's own threads
    return this.qaService.getMemberThreads(req.user.id);
  }

  @Post()
  async createThread(@Request() req, @Body() createDto: CreateQaThreadDto) {
    return this.qaService.createThread(req.user.id, createDto);
  }

  @Post(':id/reply')
  async replyToThread(
    @Request() req,
    @Param('id') id: string,
    @Body() replyDto: ReplyQaThreadDto,
  ) {
    return this.qaService.replyToThread(
      id,
      req.user.id,
      req.user.role,
      replyDto,
    );
  }

  @Post(':id/assign')
  @UseGuards(RolesGuard)
  @Roles('health_professional')
  async assignThread(@Request() req, @Param('id') id: string) {
    return this.qaService.assignThread(id, req.user.id);
  }
}
