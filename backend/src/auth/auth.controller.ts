import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  UseGuards,
  Res,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '../dto/login.dto';
import { SignupDto } from 'src/dto/sign-up.dto';
import { CustomerLoginDto } from '../dto/customer-login.dto';
import { CustomerSignupDto } from '../dto/customer-sign-up.dto';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.auth.signup(dto);
  }

  @Post('customer/signup')
  customerSignup(@Body() dto: CustomerSignupDto) {
    return this.auth.customerSignup(dto);
  }

  @Post('customer/login')
  customerLogin(@Body() dto: CustomerLoginDto) {
    return this.auth.customerLogin(dto);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {}

  @Get('customer/google')
  async customerGoogleAuth(@Req() req, @Res() res) {
    const params = req.query;
    const state = JSON.stringify(params);
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri =
      process.env.GOOGLE_CUSTOMER_CALLBACK_URL ||
      'http://localhost:3001/auth/customer/google/callback';
    const scope = 'email profile';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code&state=${encodeURIComponent(state)}`;
    res.redirect(authUrl);
  }

  @Get('customer/google/callback')
  @UseGuards(AuthGuard('customer-google'))
  async customerGoogleAuthRedirect(@Req() req, @Res() res: Response) {
    const authResponse = await this.auth.customerGoogleLogin(req.user);
    const frontendUrl =
      process.env.CUSTOMER_FRONTEND_URL || 'http://localhost:4000';
    let redirectPath = 'login';
    let extraParams = '';
    if (req.query.state) {
      try {
        const params = JSON.parse(
          decodeURIComponent(req.query.state as string),
        );
        if (params.redirect) {
          redirectPath = params.redirect;
        }
        if (params.table) extraParams += `&table=${params.table}`;
        if (params.token) extraParams += `&token=${params.token}`;
        if (params.qr) extraParams += `&qr=${params.qr}`;
      } catch (err) {
        console.error('Failed to parse OAuth state:', err);
      }
    }
    const redirectUrl = `${frontendUrl}/${redirectPath}?auth_token=${authResponse.access_token}&auth_user=${encodeURIComponent(JSON.stringify(authResponse.user))}${extraParams}`;
    res.redirect(redirectUrl);
  }

  @Post('verify-email')
  verifyEmail(@Body('token') token: string) {
    return this.auth.verifyEmail(token);
  }

  @Post('resend-verification-email')
  resendVerificationEmail(@Body('email') email: string) {
    return this.auth.resendVerificationEmail(email);
  }

  @Post('forgot-password')
  forgotPassword(
    @Body('email') email: string,
    @Body('tableToken') tableToken?: string,
  ) {
    return this.auth.forgotPassword(email, tableToken);
  }

  @Post('reset-password')
  resetPassword(
    @Body('token') token: string,
    @Body('password') password: string,
  ) {
    return this.auth.resetPassword(token, password);
  }
}
