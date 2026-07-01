import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DiscoveryService } from './discovery.service';
import { DiscoveryFiltersDto } from './dto/discovery-filters.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('discovery')
@ApiBearerAuth()
@Controller('discovery')
@UseGuards(JwtAuthGuard)
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get()
  async getDiscoveryFeed(
    @CurrentUser() user: any,
    @Query() filters: DiscoveryFiltersDto,
  ) {
    return this.discoveryService.getDiscoveryFeed(user.id, filters);
  }
}
