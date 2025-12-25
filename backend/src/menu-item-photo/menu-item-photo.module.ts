import { Module } from '@nestjs/common';
import { MenuItemPhotoController } from './menu-item-photo.controller';
import { MenuItemPhotoService } from './menu-item-photo.service';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuItem } from '../schema/menu-item.schema';
import { MenuItemPhoto } from '../schema/menu-item-photo.schema';

@Module({
  imports: [TypeOrmModule.forFeature([MenuItem, MenuItemPhoto]), AuthModule],
  controllers: [MenuItemPhotoController],
  providers: [MenuItemPhotoService],
})
export class MenuItemPhotoModule {}
