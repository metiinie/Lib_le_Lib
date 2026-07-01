import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiExcludeController } from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import { SubmitVerificationDto } from './dto/submit-verification.dto';
import { DecideVerificationDto } from './dto/decide-verification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('verification')
@ApiBearerAuth()
@ApiExcludeController()
@Controller('verification')
@UseGuards(JwtAuthGuard)
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post('submissions')
  @HttpCode(HttpStatus.CREATED)
  async submitVerification(
    @CurrentUser() user: any,
    @Body() dto: SubmitVerificationDto,
  ) {
    return this.verificationService.submitVerification(user.id, dto);
  }

  @Get('me/status')
  async getMyStatus(@CurrentUser() user: any) {
    return this.verificationService.getMyStatus(user.id);
  }

  @Get('queue')
  @UseGuards(RolesGuard)
  @Roles('verification_officer')
  async getQueue() {
    return this.verificationService.getQueue();
  }

  @Post(':id/decision')
  @UseGuards(RolesGuard)
  @Roles('verification_officer')
  @HttpCode(HttpStatus.OK)
  async decide(
    @Param('id') recordId: string,
    @CurrentUser() user: any,
    @Body() dto: DecideVerificationDto,
  ) {
    return this.verificationService.decide(user.id, recordId, dto);
  }
}
