import { Controller, Post, Body } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { SignupDto } from '../dto/sign-up.dto';
import { LoginDto } from '../dto/login.dto';

@Controller('admin-auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    return this.adminAuthService.signup(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.adminAuthService.login(dto);
  }
}
