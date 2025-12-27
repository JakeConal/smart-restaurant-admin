import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { MenuItemModifierGroup } from '../schema/menu-item-modifier.schema';
import { MenuItem } from '../schema/menu-item.schema';
import { ModifierGroup } from '../schema/modifier-group.schema';

@Injectable()
export class MenuItemModifierService {
  constructor(
    @InjectRepository(MenuItemModifierGroup)
    private readonly repo: Repository<MenuItemModifierGroup>,
    @InjectRepository(MenuItem)
    private readonly itemRepo: Repository<MenuItem>,
    @InjectRepository(ModifierGroup)
    private readonly groupRepo: Repository<ModifierGroup>,
  ) {}

  async attachGroups(restaurantId: string, itemId: string, groupIds: string[]) {
    console.log('attachGroups called with:', {
      restaurantId,
      itemId,
      groupIds,
    });

    // Validate that the menu item exists and belongs to the restaurant
    const item = await this.itemRepo.findOne({
      where: { id: itemId, restaurantId },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    // Validate that all modifier groups exist and belong to the restaurant
    if (groupIds.length > 0) {
      const groups = await this.groupRepo.find({
        where: { id: In(groupIds), restaurantId },
      });

      if (groups.length !== groupIds.length) {
        throw new BadRequestException(
          'Some modifier groups not found or do not belong to this restaurant',
        );
      }
    }

    // First, remove all existing attachments for this item
    await this.repo.delete({ menuItemId: itemId });
    console.log('Deleted existing attachments for item:', itemId);

    // Then, create new attachments
    if (groupIds.length > 0) {
      const rows = groupIds.map((groupId) => ({
        menuItemId: itemId,
        groupId,
      }));

      const result = await this.repo.save(rows);
      console.log('Saved new attachments:', result);
      return result;
    }

    console.log('No groups to attach');
    return [];
  }

  async findGroupsByItem(itemId: string) {
    console.log('findGroupsByItem called with itemId:', itemId);

    // First validate that the item exists
    const item = await this.itemRepo.findOne({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    const modifierGroups = await this.repo.find({
      where: { menuItemId: itemId },
      relations: ['group', 'group.options'],
    });

    console.log(
      'Found modifier groups:',
      modifierGroups.map((mg) => ({ id: mg.group.id, name: mg.group.name })),
    );

    return modifierGroups.map((mg) => mg.group);
  }
}
