import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { CustomerGoogleStrategy } from './strategies/customer-google.strategy';
import { JwtAuthGuard } from './guards/jwt.guards';
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
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey123',
      signOptions: {},
    }),
    EmailModule,
  ],
  providers: [
    AuthService,
    JwtStrategy,
    CustomerGoogleStrategy,
    JwtAuthGuard,
    CustomerJwtAuthGuard,
  ],
  controllers: [AuthController],
  exports: [JwtAuthGuard, CustomerJwtAuthGuard],
})
export class AuthModule {}
