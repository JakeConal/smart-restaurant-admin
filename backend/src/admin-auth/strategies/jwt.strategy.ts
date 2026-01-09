import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Users, UserStatus } from '../../schema/user.schema';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(
    @InjectRepository(Users)
    private userRepo: Repository<Users>,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET') || 'secretKey123',
    });
  }

  async validate(payload: any) {
    // Simply return payload data - user verification already done during login
    return {
      sub: payload.sub,
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions || [],
      restaurantId: 'default-restaurant',
    };
  }
}
