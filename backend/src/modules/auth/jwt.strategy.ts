import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { CurrentUserType } from '../../common/decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'dev_secret'),
    });
  }

  /**
   * Passport calls this after verifying the token signature.
   * Whatever we return here lands on `request.user` — must match
   * CurrentUserType exactly so @CurrentUser() keeps working.
   */
  validate(payload: { sub: string; storeId: string }): CurrentUserType {
    return { id: payload.sub, storeId: payload.storeId };
  }
}
