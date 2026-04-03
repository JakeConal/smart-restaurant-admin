import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuCategoryService } from './menu-category.service';
import { MenuCategoryController } from './menu-category.controller';
import { MenuCategory } from '../schema/menu-category.schema';
import { MenuItem } from '../schema/menu-item.schema';
import { CustomerAuthModule } from '../customer-auth/customer-auth.module';
@Module({
  imports: [TypeOrmModule.forFeature([MenuCategory, MenuItem]), CustomerAuthModule],
  controllers: [MenuCategoryController],
  providers: [MenuCategoryService],
})
export class MenuCategoryModule {}
