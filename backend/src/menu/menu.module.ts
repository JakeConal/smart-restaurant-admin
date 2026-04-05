import { Module } from '@nestjs/common';
import { MenuController } from './menu.controller';
import { TableModule } from '../table/table.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuService } from './menu.service';
import { MenuCategory } from './entities/menu-category.entity';
import { MenuItem } from './entities/menu-item.entity';
import { MenuItemPhoto } from './entities/menu-item-photo.entity';
import { ModifierGroup } from './entities/modifier-group.entity';
import { ModifierOption } from './entities/modifier-option.entity';
import { MenuItemModifierGroup } from './entities/menu-item-modifier.entity';
import { MenuCategoryController } from './controllers/menu-category.controller';
import { MenuItemController } from './controllers/menu-item.controller';
import { MenuItemPhotoController } from './controllers/menu-item-photo.controller';
import { ModifierGroupController } from './controllers/modifier-group.controller';
import { ModifierOptionController } from './controllers/modifier-option.controller';
import { MenuItemModifierController } from './controllers/menu-item-modifier.controller';
import { MenuCategoryService } from './services/menu-category.service';
import { MenuItemService } from './services/menu-item.service';
import { MenuItemPhotoService } from './services/menu-item-photo.service';
import { ModifierGroupService } from './services/modifier-group.service';
import { ModifierOptionService } from './services/modifier-option.service';
import { MenuItemModifierService } from './services/menu-item-modifier.service';

@Module({
  imports: [
    TableModule,
    TypeOrmModule.forFeature([
      MenuCategory,
      MenuItem,
      MenuItemPhoto,
      ModifierGroup,
      ModifierOption,
      MenuItemModifierGroup,
    ]),
  ],
  controllers: [
    MenuController,
    MenuCategoryController,
    MenuItemController,
    MenuItemPhotoController,
    ModifierGroupController,
    ModifierOptionController,
    MenuItemModifierController,
  ],
  providers: [
    MenuService,
    MenuCategoryService,
    MenuItemService,
    MenuItemPhotoService,
    ModifierGroupService,
    ModifierOptionService,
    MenuItemModifierService,
  ],
})
export class MenuModule {}

