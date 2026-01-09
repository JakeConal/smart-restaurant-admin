import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users, UserStatus } from '../../schema/user.schema';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(
    @InjectRepository(Users)
    private userRepo: Repository<Users>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'secretKey123',
    });
  }

  async validate(payload: any) {
    console.log('[AdminJwtStrategy] validate called with payload:', payload);
    
    // Load user with role and permissions for additional security checks
    const user = await this.userRepo.findOne({
      where: { id: payload.sub },
      relations: [
        'role',
        'role.rolePermissions',
        'role.rolePermissions.permission',
      ],
    });

    console.log('[AdminJwtStrategy] Found user:', user ? 'YES' : 'NO');

    // Check if user still exists and is active
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is not active');
    }

    const result = {
      sub: payload.sub,
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions || [],
      status: user.status,
      roleId: user.role_id,
      restaurantId: 'default-restaurant', // TODO: Implement proper multi-tenant system
    };
    
    console.log('[AdminJwtStrategy] Returning user:', result);
    return result;
  }
}
