import { Module } from '@nestjs/common';
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { Users } from '../users/entities/user.schema';
import { UserCredentials } from '../users/entities/user-credentials.schema';
import { RefreshToken } from './entities/refresh-token.schema';
import { Role } from '../users/entities/role.schema';
import { AdminEmailVerificationToken } from './entities/admin-email-verification-token.schema';
import { AdminPasswordResetToken } from './entities/admin-password-reset-token.schema';
import { AdminAuditLog } from './entities/admin-audit-log.schema';
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
      useFactory: (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_SECRET');
        if (!jwtSecret) {
          throw new Error('JWT_SECRET is required');
        }
        const accessExpiry = (configService.get<string>('JWT_ACCESS_EXPIRY') ||
          '15m') as JwtSignOptions['expiresIn'];

        return {
          secret: jwtSecret,
          signOptions: {
            expiresIn: accessExpiry,
          },
        };
      },
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

