import { Module } from '@nestjs/common';
import { MenuController } from './menu.controller';
import { TableModule } from '../table/table.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Table } from '../schema/table.schema';
import { TableService } from '../table/table.service';
import { QrService } from '../table/qr.service';
import { MenuService } from './menu.service';
import { MenuCategory } from '../schema/menu-category.schema';
import { MenuItem } from '../schema/menu-item.schema';
import { MenuItemPhoto } from '../schema/menu-item-photo.schema';
import { ModifierGroup } from '../schema/modifier-group.schema';
import { ModifierOption } from '../schema/modifier-option.schema';
import { MenuItemModifierGroup } from '../schema/menu-item-modifier.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Table,
      MenuCategory,
      MenuItem,
      MenuItemPhoto,
      ModifierGroup,
      ModifierOption,
      MenuItemModifierGroup,
    ]),
  ],
  controllers: [MenuController],
  providers: [TableService, QrService, MenuService],
})
export class MenuModule {}
