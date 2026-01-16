import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Res,
  Headers,
  Ip,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AdminAuthService } from './admin-auth.service';
import { SignupDto } from '../dto/sign-up.dto';
import { LoginDto } from '../dto/login.dto';
import { AdminVerifyEmailDto } from '../dto/admin-verify-email.dto';
import { AdminResendVerificationDto } from '../dto/admin-resend-verification.dto';
import { AdminForgotPasswordDto } from '../dto/admin-forgot-password.dto';
import { AdminResetPasswordDto } from '../dto/admin-reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('admin-auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) { }

  @Post('signup')
  async signup(@Body() dto: SignupDto & { fullName: string }) {
    return this.adminAuthService.signup(dto);
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Headers('user-agent') userAgent: string,
    @Ip() ipAddress: string,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const result = await this.adminAuthService.login(dto, userAgent, ipAddress);

    // Cookie configuration
    const env = (process.env.NODE_ENV || 'development').toLowerCase();
    const isProd = env === 'production';
    const host = req.get('host') || '';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

    // On production/deploy, we MUST use Secure and SameSite=None
    // Even on local, if you use a proxy, Secure/None is often safer.
    const cookieOptions: any = {
      httpOnly: true,
      secure: true, // Requirement for SameSite=None
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      path: '/',
      partitioned: true,
    };

    // Fallback for non-https local development
    if (isLocalhost && !isProd) {
      cookieOptions.secure = false;
      cookieOptions.sameSite = 'lax';
      delete cookieOptions.partitioned;
    }

    console.log(`[Auth] Setting cookie for ${dto.email}. isProd: ${isProd}, Secure: ${cookieOptions.secure}`);
    res.cookie('refresh_token', result.refresh_token, cookieOptions);

    return {
      access_token: result.access_token,
      user: result.user,
    };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }
    const result = await this.adminAuthService.refreshAccessToken(refreshToken);

    const env = (process.env.NODE_ENV || 'development').toLowerCase();
    const isProd = env === 'production';
    const host = req.get('host') || '';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

    const cookieOptions: any = {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      path: '/',
      partitioned: true,
    };

    if (isLocalhost && !isProd) {
      cookieOptions.secure = false;
      cookieOptions.sameSite = 'lax';
      delete cookieOptions.partitioned;
    }

    res.cookie('refresh_token', result.refresh_token, cookieOptions);

    return {
      access_token: result.access_token,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refresh_token'];
    if (refreshToken) {
      await this.adminAuthService.logout(refreshToken);
    }

    const env = (process.env.NODE_ENV || 'development').toLowerCase();
    const isProd = env === 'production';
    const host = req.get('host') || '';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

    const cookieOptions: any = {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      partitioned: true,
    };

    if (isLocalhost && !isProd) {
      cookieOptions.secure = false;
      cookieOptions.sameSite = 'lax';
      delete cookieOptions.partitioned;
    }

    res.clearCookie('refresh_token', cookieOptions);

    return { message: 'Logged out successfully' };
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  async logoutAll(@Req() req: any) {
    await this.adminAuthService.logoutAll(req.user.sub);
    return { message: 'Logged out from all devices successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: any) {
    return {
      user: req.user,
    };
  }

  // ============= EMAIL VERIFICATION =============

  @Post('verify-email')
  async verifyEmail(@Body() dto: AdminVerifyEmailDto, @Req() req: Request) {
    return this.adminAuthService.verifyEmail(dto.token, req);
  }

  @Post('resend-verification')
  async resendVerification(@Body() dto: AdminResendVerificationDto, @Req() req: Request) {
    return this.adminAuthService.resendVerification(dto.email, req);
  }

  // ============= PASSWORD RESET =============

  @Post('forgot-password')
  async forgotPassword(@Body() dto: AdminForgotPasswordDto, @Req() req: Request) {
    return this.adminAuthService.forgotPassword(dto.email, req);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: AdminResetPasswordDto, @Req() req: Request) {
    return this.adminAuthService.resetPassword(dto.token, dto.newPassword, req);
  }
}
