import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Guard that enforces role-based access control.
 *
 * Usage: @UseGuards(JwtAuthGuard, RolesGuard)
 *        @Roles('admin', 'verification_officer')
 *
 * Ensures the authenticated user (`request.user`) has one of the
 * required roles. If no roles are specified, access is granted.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'User role not found.',
        },
      });
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to perform this action.',
        },
      });
    }

    return true;
  }
}
