import {
  Controller,
  Get,
  Put,
  Post,
  UseGuards,
  Req,
  Body,
  UploadedFile,
  UseInterceptors,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ProfileService } from './profile.service';
import { CustomerJwtAuthGuard } from '../auth/guards/customer-jwt-auth.guard';
import { ChangePasswordDto } from '../dto/change-password.dto';

@Controller('profile')
@UseGuards(CustomerJwtAuthGuard)
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Get()
  async getProfile(@Req() req: any) {
    return this.profileService.getProfile(req.user.sub);
  }

  @Put()
  async updateProfile(@Req() req: any, @Body() updateData: any) {
    return this.profileService.updateProfile(req.user.sub, updateData);
  }

  @Post('picture')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePicture(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.profileService.uploadProfilePicture(req.user.sub, file.buffer);
  }

  @Get('picture')
  async getProfilePicture(@Req() req: any, @Res() res: Response) {
    try {
      const customerId = req.user?.sub;

      if (!customerId) {
        console.log('❌ No customerId in req.user:', req.user);
        return (res as any).status(401).json({ error: 'Unauthorized' });
      }

      console.log('✅ Loading avatar for customer:', customerId);
      const picture = await this.profileService.getProfilePicture(customerId);

      // Set proper cache control headers to prevent caching
      (res as any).setHeader(
        'Cache-Control',
        'no-cache, no-store, must-revalidate, max-age=0',
      );
      (res as any).setHeader('Pragma', 'no-cache');
      (res as any).setHeader('Expires', '0');
      (res as any).setHeader('ETag', `"${Date.now()}"`); // Add timestamp as ETag to bust cache
      (res as any).setHeader('Content-Type', 'image/jpeg');
      (res as any).setHeader('Content-Length', Buffer.byteLength(picture));

      (res as any).send(picture);
    } catch (error) {
      // Return 404 for any error (picture not found, customer not found, etc)
      console.log('❌ Error in getProfilePicture:', error);
      (res as any).status(404).end();
    }
  }

  @Put('password')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async updatePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.profileService.updatePassword(
      req.user.sub,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}

