import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerAuthController } from './customer-auth.controller';
import { CustomerJwtStrategy } from './strategies/customer-jwt.strategy';
import { CustomerGoogleStrategy } from './strategies/customer-google.strategy';
import { CustomerJwtAuthGuard } from './guards/customer-jwt-auth.guard';
import { Customer } from './entities/customer.schema';
import { EmailVerificationToken } from './entities/email-verification-token.schema';
import { PasswordResetToken } from './entities/password-reset-token.schema';
import { EmailModule } from '../email/email.module';
import { IsPasswordComplexConstraint } from '../common/password-complexity.validator';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      EmailVerificationToken,
      PasswordResetToken,
    ]),
    PassportModule.register({ defaultStrategy: 'customer-jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
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
    }),
    EmailModule,
  ],
  providers: [
    CustomerAuthService,
    CustomerJwtStrategy,
    CustomerGoogleStrategy,
    CustomerJwtAuthGuard,
    IsPasswordComplexConstraint,
  ],
  controllers: [CustomerAuthController],
  exports: [CustomerJwtAuthGuard, CustomerAuthService],
})
export class CustomerAuthModule {}

