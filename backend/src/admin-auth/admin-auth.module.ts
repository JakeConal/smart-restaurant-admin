import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { Users } from '../schema/user.schema';
import { UserCredentials } from '../schema/UserCredentials';
import { RefreshToken } from '../schema/RefreshToken';
import { Role } from '../schema/Role';
import { AdminJwtStrategy } from './strategies/jwt.strategy';
import { AdminGuard } from './guards/admin.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionGuard } from './guards/permission.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users, UserCredentials, RefreshToken, Role]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'secretKey123',
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AdminAuthController],
  providers: [
    AdminAuthService,
    AdminJwtStrategy,
    AdminGuard,
    JwtAuthGuard,
    PermissionGuard,
  ],
  exports: [AdminGuard, JwtAuthGuard, PermissionGuard],
})
export class AdminAuthModule {}
