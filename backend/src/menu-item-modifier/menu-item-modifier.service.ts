import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuItemModifierGroup } from '../schema/menu-item-modifier.schema';

@Injectable()
export class MenuItemModifierService {
  constructor(
    @InjectRepository(MenuItemModifierGroup)
    private readonly repo: Repository<MenuItemModifierGroup>,
  ) {}

  async attachGroups(restaurantId: string, itemId: string, groupIds: string[]) {
    const rows = groupIds.map((groupId) => ({
      menuItemId: itemId,
      groupId,
    }));

    return this.repo.save(rows);
  }

  async findGroupsByItem(itemId: string) {
    return this.repo.find({ where: { menuItemId: itemId } });
  }
}
