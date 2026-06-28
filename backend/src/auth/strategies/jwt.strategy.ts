import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersRepository } from '../../users/repositories/users.repository';

/**
 * JWT strategy for Passport. Validates access tokens and attaches
 * the user to the request object.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersRepository: UsersRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback_secret',
    });
  }

  /**
   * Called by Passport after the JWT is verified. Returns the user
   * object that gets attached to `request.user`.
   */
  async validate(payload: { sub: string; role: string }) {
    const user = await this.usersRepository.findById(payload.sub);

    if (!user || ['suspended', 'banned', 'deleted'].includes(user.status)) {
      throw new UnauthorizedException({
        error: {
          code: 'TOKEN_INVALID',
          message: 'User account is not active.',
        },
      });
    }

    return { id: user.id, role: user.role, status: user.status };
  }
}
