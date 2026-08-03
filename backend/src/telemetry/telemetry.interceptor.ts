import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { TelemetryService } from './telemetry.service';

@Injectable()
export class TelemetryInterceptor implements NestInterceptor {
  constructor(private readonly telemetryService: TelemetryService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    // We remove query parameters and use the route path (if available) to avoid high cardinality
    const route = request.route ? request.route.path : request.path;
    const endpoint = `${method} ${route}`;

    // Only record for specific tracked endpoints to save memory and processing
    const trackedEndpoints = [
      'POST /swipes',
      'POST /messages',
      'GET /discovery/feed'
    ];

    if (!trackedEndpoints.includes(endpoint)) {
      return next.handle();
    }

    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        this.telemetryService.recordMetric(endpoint, duration);
      }),
    );
  }
}
