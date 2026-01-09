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
import { JwtAuthGuard } from '../auth/guards/jwt.guards';
import { ChangePasswordDto } from '../dto/change-password.dto';

@Controller('profile')
@UseGuards(JwtAuthGuard)
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
        return res.status(401).json({ error: 'Unauthorized' });
      }

      console.log('✅ Loading avatar for customer:', customerId);
      const picture = await this.profileService.getProfilePicture(customerId);

      // Set proper cache control headers to prevent caching
      res.setHeader(
        'Cache-Control',
        'no-cache, no-store, must-revalidate, max-age=0',
      );
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('ETag', `"${Date.now()}"`); // Add timestamp as ETag to bust cache
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Content-Length', Buffer.byteLength(picture));

      res.send(picture);
    } catch (error) {
      // Return 404 for any error (picture not found, customer not found, etc)
      console.log('❌ Error in getProfilePicture:', error);
      res.status(404).end();
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
