import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiExcludeController,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateReportDto } from './dto/create-report.dto';
import { ModerationActionDto } from './dto/moderation-action.dto';
import { ReportCategory, ReportSeverity, ReportStatus } from './entities/report.entity';
import { UserStatus } from '../users/entities/user.entity';

@ApiTags('reports')
@ApiBearerAuth()
@ApiExcludeController()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post()
  @ApiOperation({ summary: 'Submit a new report' })
  async createReport(@Body() dto: CreateReportDto, @Req() req: any) {
    const report = await this.reportsService.createReport(req.user.id, dto);
    return { id: report.id };
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('moderator', 'admin')
  @ApiOperation({ summary: 'Get filtered reports queue (Moderators & Admins)' })
  async getQueue(
    @Query('limit') limitStr: string,
    @Query('offset') offsetStr: string,
    @Query('status') status: string,
    @Query('severity') severity: string,
    @Query('category') category: string,
  ) {
    const limit = parseInt(limitStr, 10) || 50;
    const offset = parseInt(offsetStr, 10) || 0;
    const [data, total] = await this.reportsService.getQueue(
      limit,
      offset,
      status as ReportStatus,
      severity as ReportSeverity,
      category as ReportCategory,
    );
    return { data, total, limit, offset };
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('moderator', 'admin')
  @ApiOperation({ summary: 'Get report details with full user relations' })
  async getReportDetails(@Param('id') id: string) {
    return this.reportsService.getReportDetails(id);
  }

  @Patch('users/:id/status')
  @UseGuards(RolesGuard)
  @Roles('moderator', 'admin')
  @ApiOperation({ summary: 'Directly update user account status (Suspend / Ban / Activate)' })
  async updateUserStatus(
    @Param('id') userId: string,
    @Body() body: { status: UserStatus; reason?: string },
    @Req() req: any,
  ) {
    return this.reportsService.updateUserStatus(
      req.user.id,
      req.user.role,
      userId,
      body.status,
      body.reason,
    );
  }

  @Post(':id/actions')
  @UseGuards(RolesGuard)
  @Roles('moderator', 'admin')
  @ApiOperation({ summary: 'Perform a moderation action on a report' })
  async performAction(
    @Param('id') reportId: string,
    @Body() dto: ModerationActionDto,
    @Req() req: any,
  ) {
    const action = await this.reportsService.performAction(
      req.user.id,
      req.user.role,
      reportId,
      dto,
    );
    return { id: action.id };
  }
}
