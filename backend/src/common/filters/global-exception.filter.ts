import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseBody = exception.getResponse() as any;

      // If validation error (class-validator) or standard NestJS exception
      if (typeof responseBody === 'object' && responseBody !== null) {
        if (
          typeof responseBody.error === 'object' &&
          responseBody.error !== null
        ) {
          // Handle nested error object e.g. { error: { code: '...', message: '...' } }
          code = responseBody.error.code || 'HTTP_EXCEPTION';
          message = responseBody.error.message || exception.message;
        } else {
          message = Array.isArray(responseBody.message)
            ? responseBody.message.join(', ')
            : responseBody.message || exception.message;
          code =
            responseBody.error && typeof responseBody.error === 'string'
              ? responseBody.error.toUpperCase().replace(/\s+/g, '_')
              : 'HTTP_EXCEPTION';
        }
      } else {
        message = exception.message;
        code = 'HTTP_EXCEPTION';
      }
    } else {
      // Log the original exception for debugging, but do not leak to client
      this.logger.error(
        `Unhandled Exception: ${exception instanceof Error ? exception.message : 'Unknown'}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    // Explicit shape per conventions.md
    response.status(status).json({
      error: {
        code,
        message,
      },
    });
  }
}
