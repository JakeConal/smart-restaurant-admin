import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuItemModifierController } from './menu-item-modifier.controller';
import { MenuItemModifierService } from './menu-item-modifier.service';
import { MenuItemModifierGroup } from '../schema/menu-item-modifier.schema';

@Module({
  imports: [TypeOrmModule.forFeature([MenuItemModifierGroup])],
  controllers: [MenuItemModifierController],
  providers: [MenuItemModifierService],
})
export class MenuItemModifierModule {}
