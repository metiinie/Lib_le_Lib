import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract the authenticated user from the request.
 * Requires `JwtAuthGuard` to be applied to the route or controller.
 *
 * Usage: @CurrentUser() user: { id: string, role: string, status: string }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
