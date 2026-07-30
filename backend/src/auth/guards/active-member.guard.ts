import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * Guard that ensures a member's account is fully verified (status = 'active')
 * before accessing member-facing routes.
 *
 * Non-member roles (verification_officer, moderator, admin, health_professional)
 * pass through unconditionally — they don't go through the member verification
 * flow and should never be blocked by this guard.
 *
 * Usage: @UseGuards(JwtAuthGuard, ActiveMemberGuard)
 *
 * Routes intentionally NOT protected by this guard:
 *   - GET /discovery          (blurred preview for pending members is allowed)
 *   - GET /verification/me/status  (they need this to track their own status)
 */
@Injectable()
export class ActiveMemberGuard implements CanActivate {
  private static readonly NON_MEMBER_ROLES = [
    'verification_officer',
    'moderator',
    'admin',
    'health_professional',
  ] as const;

  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest<{
      user: { id: string; role: string; status: string };
    }>();

    // Non-member roles (staff) are never blocked by this guard
    if (
      ActiveMemberGuard.NON_MEMBER_ROLES.includes(user.role as any)
    ) {
      return true;
    }

    // Members must be fully active (verified)
    if (user.status !== 'active') {
      throw new ForbiddenException({
        error: {
          code: 'VERIFICATION_REQUIRED',
          message:
            'Your account must be verified before accessing this feature.',
        },
      });
    }

    return true;
  }
}
