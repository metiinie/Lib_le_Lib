import {
  Controller,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { VideoCallsService } from './video-calls.service';
import { ScheduleVideoCallDto } from './dto/schedule-video-call.dto';
import { UpdateVideoCallStatusDto } from './dto/update-video-call-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('video-calls')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('matches/:matchId/video-calls')
export class VideoCallsController {
  constructor(private readonly videoCallsService: VideoCallsService) {}

  @Post()
  @ApiOperation({ summary: 'Schedule a video verification call' })
  async scheduleCall(
    @Param('matchId') matchId: string,
    @Body() dto: ScheduleVideoCallDto,
    @Req() req: any,
  ) {
    const scheduledAt = dto.scheduledAt
      ? new Date(dto.scheduledAt)
      : new Date();
    const call = await this.videoCallsService.scheduleCall(
      matchId,
      req.user.id,
      scheduledAt,
    );
    return { id: call.id, scheduledAt: call.scheduledAt };
  }

  @Patch(':callId')
  @ApiOperation({ summary: 'Update video call status' })
  async updateStatus(
    @Param('matchId') matchId: string,
    @Param('callId') callId: string,
    @Body() dto: UpdateVideoCallStatusDto,
    @Req() req: any,
  ) {
    const call = await this.videoCallsService.updateStatus(
      matchId,
      callId,
      req.user.id,
      dto.status,
    );
    return { id: call.id, status: call.status };
  }
}
