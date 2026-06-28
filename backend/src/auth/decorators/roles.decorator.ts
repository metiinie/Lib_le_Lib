import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to set the required roles on a route handler.
 *
 * Usage: @Roles('admin', 'moderator')
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
