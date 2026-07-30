import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { QaService } from './qa.service';
import { CreateQaThreadDto } from './dto/create-qa-thread.dto';
import { ReplyQaThreadDto } from './dto/reply-qa-thread.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActiveMemberGuard } from '../auth/guards/active-member.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('qa')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('qa/threads')
export class QaController {
  constructor(private readonly qaService: QaService) {}

  /**
   * Returns threads scoped to the caller's role.
   * - member: their own threads only
   * - health_professional: threads assigned to or open for them
   * - admin: all threads (with optional status filter)
   *
   * No other role (officer, moderator) may list Q&A threads.
   */
  @Get()
  @UseGuards(RolesGuard, ActiveMemberGuard)
  @Roles('member', 'health_professional', 'admin')
  async getThreads(@Request() req, @Query('status') status: string) {
    if (req.user.role === 'admin') {
      return this.qaService.getAllThreadsForAdmin(status);
    }
    if (req.user.role === 'health_professional') {
      return this.qaService.getProfessionalThreads(req.user.id);
    }
    // member: own threads only
    return this.qaService.getMemberThreads(req.user.id);
  }

  /**
   * Opens a new Q&A thread.
   * Only members may open threads — health professionals reply, not open.
   */
  @Post()
  @UseGuards(RolesGuard, ActiveMemberGuard)
  @Roles('member')
  async createThread(@Request() req, @Body() createDto: CreateQaThreadDto) {
    return this.qaService.createThread(req.user.id, createDto);
  }

  /**
   * Posts a reply on an existing thread.
   * - member: can reply to their own thread only (enforced in service layer)
   * - health_professional: can reply to their assigned thread only (enforced in service layer)
   *
   * No other role may reply to a Q&A thread.
   */
  @Post(':id/reply')
  @UseGuards(RolesGuard, ActiveMemberGuard)
  @Roles('member', 'health_professional')
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

  /**
   * Self-assigns an open thread to a health professional.
   * Only health_professional role may call this.
   */
  @Post(':id/assign')
  @UseGuards(RolesGuard)
  @Roles('health_professional')
  async assignThread(@Request() req, @Param('id') id: string) {
    return this.qaService.assignThread(id, req.user.id);
  }
}
