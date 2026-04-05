import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Users, UserStatus } from '../../users/entities/user.schema';

type AdminJwtPayload = {
  sub: string;
  email: string;
  permissions?: string[];
};

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(
    @InjectRepository(Users)
    private userRepo: Repository<Users>,
    private configService: ConfigService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is required');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: AdminJwtPayload) {
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
      restaurantId: user.restaurantId,
    };
  }
}

