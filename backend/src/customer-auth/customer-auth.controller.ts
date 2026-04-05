import {
  BadRequestException,
  Controller,
  Post,
  Body,
  Get,
  Req,
  UseGuards,
  Res,
  Logger,
} from '@nestjs/common';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { CustomerSignupDto } from './dto/customer-sign-up.dto';
import { CustomerVerifyEmailDto } from './dto/customer-verify-email.dto';
import { CustomerResendVerificationDto } from './dto/customer-resend-verification.dto';
import { CustomerForgotPasswordDto } from './dto/customer-forgot-password.dto';
import { CustomerResetPasswordDto } from './dto/customer-reset-password.dto';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

@Controller('auth')
export class CustomerAuthController {
  private readonly logger = new Logger(CustomerAuthController.name);

  constructor(
    private readonly auth: CustomerAuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('customer/signup')
  customerSignup(@Body() dto: CustomerSignupDto) {
    return this.auth.customerSignup(dto);
  }

  @Post('customer/login')
  customerLogin(@Body() dto: CustomerLoginDto) {
    return this.auth.customerLogin(dto);
  }

  @Get('customer/google')
  async customerGoogleAuth(@Req() req: Request, @Res() res: Response) {
    const params = req.query;
    const state = JSON.stringify(params);
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new BadRequestException('Google OAuth is not configured');
    }
    const redirectUri =
      this.configService.get<string>('GOOGLE_CUSTOMER_CALLBACK_URL') ||
      'http://localhost:3001/customer-auth/customer/google/callback';
    const scope = 'email profile';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code&state=${encodeURIComponent(state)}`;
    res.redirect(authUrl);
  }

  @Get('customer/google/callback')
  @UseGuards(AuthGuard('customer-google'))
  async customerGoogleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const authResponse = await this.auth.customerGoogleLogin(req.user);
    const frontendUrl =
      this.configService.get<string>('CUSTOMER_FRONTEND_URL') ||
      'http://localhost:4000';
    let redirectPath = 'login';
    const fragmentParams = new URLSearchParams({
      auth_token: authResponse.access_token,
      auth_user: JSON.stringify(authResponse.user),
    });

    if (req.query.state) {
      try {
        const params = JSON.parse(
          decodeURIComponent(req.query.state as string),
        );
        if (params.redirect) {
          redirectPath = params.redirect;
        }
        if (params.table) {
          fragmentParams.set('table', String(params.table));
        }
        if (params.token) {
          fragmentParams.set('token', String(params.token));
        }
        if (params.qr) {
          fragmentParams.set('qr', String(params.qr));
        }
      } catch (err) {
        this.logger.warn(`Failed to parse OAuth state: ${(err as Error).message}`);
      }
    }

    const safeRedirectPath = String(redirectPath).replace(/^\/+/, '') || 'login';
    const redirectUrl = `${frontendUrl}/${safeRedirectPath}#${fragmentParams.toString()}`;
    res.redirect(redirectUrl);
  }

  @Post('verify-email')
  verifyEmail(@Body() dto: CustomerVerifyEmailDto) {
    return this.auth.verifyEmail(dto.token);
  }

  @Post('resend-verification-email')
  resendVerificationEmail(@Body() dto: CustomerResendVerificationDto) {
    return this.auth.resendVerificationEmail(dto.email);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: CustomerForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email, dto.tableToken);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: CustomerResetPasswordDto) {
    return this.auth.resetPassword(dto.token, dto.password);
  }
}

