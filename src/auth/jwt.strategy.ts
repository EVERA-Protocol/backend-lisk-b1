import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET ||
        'your-super-secret-jwt-key-change-this-in-production',
    });
  }

  validate(payload: any) {
    // This object will be injected into req.user
    const now = new Date();
    if (!(payload.exp && new Date(payload.exp).getTime() < now.getTime())) {
      throw new UnauthorizedException('token expired');
    }
    return {
      userId: payload.sub,
      address: payload.address,
    };
  }
}
