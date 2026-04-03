import { Module } from '@nestjs/common';
import { MenuItemPhotoController } from './menu-item-photo.controller';
import { MenuItemPhotoService } from './menu-item-photo.service';
import { CustomerAuthModule } from '../customer-auth/customer-auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuItem } from '../schema/menu-item.schema';
import { MenuItemPhoto } from '../schema/menu-item-photo.schema';

@Module({
  imports: [TypeOrmModule.forFeature([MenuItem, MenuItemPhoto]), CustomerAuthModule],
  controllers: [MenuItemPhotoController],
  providers: [MenuItemPhotoService],
})
export class MenuItemPhotoModule {}
