import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SafetyService } from './safety.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BlockUserDto } from './dto/block-user.dto';

@ApiTags('safety')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('blocks')
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  @Post()
  @ApiOperation({ summary: 'Block a user' })
  async blockUser(@Body() dto: BlockUserDto, @Req() req: any) {
    const block = await this.safetyService.blockUser(
      req.user.id,
      dto.blockedId,
    );
    return { id: block.id };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unblock a user' })
  async unblockUser(@Param('id') blockId: string, @Req() req: any) {
    await this.safetyService.unblockUser(req.user.id, blockId);
  }
}
