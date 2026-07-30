import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditLogsService } from './audit-logs.service';

@ApiTags('admin-audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/audit-logs')
export class AdminAuditController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get system audit trail logs (Admin only)' })
  async getAuditLogs(
    @Query('limit') limitStr: string,
    @Query('offset') offsetStr: string,
  ) {
    const limit = parseInt(limitStr, 10) || 50;
    const offset = parseInt(offsetStr, 10) || 0;
    return this.auditLogsService.getAuditLogs(limit, offset);
  }
}
