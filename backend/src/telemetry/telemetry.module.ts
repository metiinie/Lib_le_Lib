import { Module } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { TelemetryController } from './telemetry.controller';
import { TelemetryInterceptor } from './telemetry.interceptor';

@Module({
  controllers: [TelemetryController],
  providers: [TelemetryService, TelemetryInterceptor],
  exports: [TelemetryService, TelemetryInterceptor],
})
export class TelemetryModule {}
