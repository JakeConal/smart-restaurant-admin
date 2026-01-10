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
import { AdminEmailVerificationToken } from '../schema/admin-email-verification-token.schema';
import { AdminPasswordResetToken } from '../schema/admin-password-reset-token.schema';
import { AdminAuditLog } from '../schema/admin-audit-log.schema';
import { AdminJwtStrategy } from './strategies/jwt.strategy';
import { AdminGuard } from './guards/admin.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionGuard } from './guards/permission.guard';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Users,
      UserCredentials,
      RefreshToken,
      Role,
      AdminEmailVerificationToken,
      AdminPasswordResetToken,
      AdminAuditLog,
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'secretKey123',
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
    EmailModule,
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
