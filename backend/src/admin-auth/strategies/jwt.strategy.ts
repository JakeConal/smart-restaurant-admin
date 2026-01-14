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
    // Check if user still exists and is ACTIVE
    const user = await this.userRepo.findOne({
      where: { id: payload.sub },
      relations: ['role'],
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Your account has been suspended. Please contact admin.');
    }

    if (user.status === UserStatus.DELETED) {
      throw new UnauthorizedException('Your account has been deleted.');
    }

    return {
      sub: payload.sub,
      userId: payload.sub,
      email: payload.email,
      role: user.role.code,
      permissions: payload.permissions || [],
      restaurantId: user.restaurantId || 'default-restaurant',
    };
  }
}
