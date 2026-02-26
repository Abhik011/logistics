import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class DriverJwtStrategy extends PassportStrategy(Strategy ,'driver-token') {
  constructor() {
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET not defined');
}

super({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
});
  }

  async validate(payload: any) {
    //  console.log("JWT PAYLOAD:", payload);
    return {
      sub: payload.sub,
      role: payload.role,
    };
  }
}