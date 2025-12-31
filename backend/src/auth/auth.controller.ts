import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  UseGuards,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '../dto/login.dto';
import { SignupDto } from 'src/dto/sign-up.dto';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.auth.signup(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const authResponse = await this.auth.googleLogin(req.user);
    const frontendUrl =
      process.env.ADMIN_FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/login?token=${authResponse.access_token}&user=${encodeURIComponent(JSON.stringify(authResponse.user))}`;
    res.redirect(redirectUrl);
  }
}
