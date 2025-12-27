import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  Param,
  BadRequestException,
  UploadedFiles,
  Delete,
  Patch,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MenuItemPhotoService } from './menu-item-photo.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guards';
import { AdminGuard } from '../auth/guards/admin.guards';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';

@Controller('api/admin/menu/items')
@UseGuards(AdminGuard)
export class MenuItemPhotoController {
  constructor(private readonly service: MenuItemPhotoService) {}

  @Post(':id/photos')
  @UseInterceptors(
    FilesInterceptor('photos', 5, {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          cb(new BadRequestException('Invalid file type'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadPhotos(
    @Param('id') itemId: string,
    @CurrentUser() user: AuthUser,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.service.addPhotos(user.restaurantId, itemId, files);
  }

  @Delete(':itemId/photos/:photoId')
  removePhoto(
    @Param('itemId') itemId: string,
    @Param('photoId') photoId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.removePhoto(user.restaurantId, itemId, photoId);
  }

  @Patch(':itemId/photos/:photoId/primary')
  setPrimary(
    @Param('itemId') itemId: string,
    @Param('photoId') photoId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.setPrimaryPhoto(user.restaurantId, itemId, photoId);
  }
}
