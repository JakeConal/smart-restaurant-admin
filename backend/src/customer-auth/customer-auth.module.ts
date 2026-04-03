import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerAuthController } from './customer-auth.controller';
import { CustomerJwtStrategy } from './strategies/customer-jwt.strategy';
import { CustomerGoogleStrategy } from './strategies/customer-google.strategy';
import { CustomerJwtAuthGuard } from './guards/customer-jwt-auth.guard';
import { Customer } from '../schema/customer.schema';
import { EmailVerificationToken } from '../schema/email-verification-token.schema';
import { PasswordResetToken } from '../schema/password-reset-token.schema';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      EmailVerificationToken,
      PasswordResetToken,
    ]),
    PassportModule.register({ defaultStrategy: 'customer-jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey123',
      signOptions: {},
    }),
    EmailModule,
  ],
  providers: [
    CustomerAuthService,
    CustomerJwtStrategy,
    CustomerGoogleStrategy,
    CustomerJwtAuthGuard,
  ],
  controllers: [CustomerAuthController],
  exports: [CustomerJwtAuthGuard, CustomerAuthService],
})
export class CustomerAuthModule {}
