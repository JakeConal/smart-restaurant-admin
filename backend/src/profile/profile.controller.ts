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
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { ProfileService } from './profile.service';
import { CustomerJwtAuthGuard } from '../customer-auth/guards/customer-jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('profile')
@UseGuards(CustomerJwtAuthGuard)
export class ProfileController {
  private readonly logger = new Logger(ProfileController.name);

  constructor(private profileService: ProfileService) {}

  @Get()
  async getProfile(@Req() req: Request & { user: { sub: string } }) {
    return this.profileService.getProfile(req.user.sub);
  }

  @Put()
  async updateProfile(
    @Req() req: Request & { user: { sub: string } },
    @Body() updateData: Record<string, unknown>,
  ) {
    return this.profileService.updateProfile(req.user.sub, updateData);
  }

  @Post('picture')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePicture(
    @Req() req: Request & { user: { sub: string } },
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.profileService.uploadProfilePicture(req.user.sub, file.buffer);
  }

  @Get('picture')
  async getProfilePicture(
    @Req() req: Request & { user?: { sub?: string } },
    @Res() res: Response,
  ) {
    try {
      const customerId = req.user?.sub;

      if (!customerId) {
        this.logger.warn('No customerId in req.user');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      this.logger.debug(`Loading avatar for customer: ${customerId}`);
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
      this.logger.warn(
        `Error in getProfilePicture: ${(error as Error).message}`,
      );
      res.status(404).end();
    }
  }

  @Put('password')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async updatePassword(
    @Req() req: Request & { user: { sub: string } },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.profileService.updatePassword(
      req.user.sub,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}


