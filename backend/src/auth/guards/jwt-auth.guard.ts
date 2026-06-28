import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard that enforces JWT authentication on routes.
 *
 * Usage: @UseGuards(JwtAuthGuard)
 *
 * After passing this guard, `request.user` contains
 * `{ id: string, role: string, status: string }`.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
