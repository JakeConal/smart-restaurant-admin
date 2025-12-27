import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuItemModifierController } from './menu-item-modifier.controller';
import { MenuItemModifierService } from './menu-item-modifier.service';
import { MenuItemModifierGroup } from '../schema/menu-item-modifier.schema';
import { MenuItem } from '../schema/menu-item.schema';
import { ModifierGroup } from '../schema/modifier-group.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([MenuItemModifierGroup, MenuItem, ModifierGroup]),
  ],
  controllers: [MenuItemModifierController],
  providers: [MenuItemModifierService],
})
export class MenuItemModifierModule {}
