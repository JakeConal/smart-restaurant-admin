import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { MenuCategory, CategoryStatus } from '../schema/menu-category.schema';
import { MenuItem, MenuItemStatus } from '../schema/menu-item.schema';
import { MenuItemPhoto } from '../schema/menu-item-photo.schema';
import { ModifierGroup } from '../schema/modifier-group.schema';
import { ModifierOption } from '../schema/modifier-option.schema';
import { MenuItemModifierGroup } from '../schema/menu-item-modifier.schema';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(MenuCategory)
    private readonly categoryRepo: Repository<MenuCategory>,
    @InjectRepository(MenuItem)
    private readonly itemRepo: Repository<MenuItem>,
    @InjectRepository(MenuItemPhoto)
    private readonly photoRepo: Repository<MenuItemPhoto>,
    @InjectRepository(ModifierGroup)
    private readonly modifierGroupRepo: Repository<ModifierGroup>,
    @InjectRepository(ModifierOption)
    private readonly modifierOptionRepo: Repository<ModifierOption>,
    @InjectRepository(MenuItemModifierGroup)
    private readonly itemModifierRepo: Repository<MenuItemModifierGroup>,
  ) {}

  async getGuestMenu(
    restaurantId: string,
    query: {
      q?: string;
      categoryId?: string;
      sort?: string;
      chefRecommended?: boolean;
      page?: number;
      limit?: number;
    },
  ) {
    const {
      q,
      categoryId,
      sort,
      chefRecommended,
      page = 1,
      limit = 20,
    } = query;

    // Get active categories
    const categories = await this.categoryRepo.find({
      where: { restaurantId, status: CategoryStatus.ACTIVE },
      order: { name: 'ASC' },
    });

    // Build where conditions for items
    const where: any = { restaurantId, isDeleted: false };
    if (categoryId) where.categoryId = categoryId;
    if (chefRecommended !== undefined)
      where.isChefRecommended = chefRecommended;
    if (q) where.name = Like(`%${q}%`);

    // Sort options
    let order: any = { name: 'ASC' };
    if (sort === 'popularity') {
      // Sort by popularity score (higher scores first), then by name
      order = { popularityScore: 'DESC', name: 'ASC' };
    }

    // Get items with pagination
    const [items, total] = await this.itemRepo.findAndCount({
      where,
      order,
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get item IDs
    const itemIds = items.map((item) => item.id);

    // Get primary photos for items
    const photos = await this.photoRepo.find({
      where: { menuItemId: In(itemIds), isPrimary: true },
    });
    const photoMap = new Map(photos.map((p) => [p.menuItemId, p]));

    // Get modifier groups for items
    const itemModifiers = await this.itemModifierRepo.find({
      where: { menuItemId: In(itemIds) },
    });
    const groupIds = itemModifiers.map((im) => im.groupId);
    const groups = await this.modifierGroupRepo.find({
      where: { id: In(groupIds) },
    });
    const groupMap = new Map(groups.map((g) => [g.id, g]));

    // Get options for groups
    const options = await this.modifierOptionRepo.find({
      where: { groupId: In(groupIds) },
    });
    const optionsByGroup = options.reduce(
      (acc, opt) => {
        if (!acc[opt.groupId]) acc[opt.groupId] = [];
        acc[opt.groupId].push(opt);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    // Attach modifiers to items
    const itemsWithModifiers = items.map((item) => {
      const itemMods = itemModifiers.filter((im) => im.menuItemId === item.id);
      const modifierGroups = itemMods
        .map((im) => {
          const group = groupMap.get(im.groupId);
          if (group) {
            return {
              ...group,
              options: optionsByGroup[group.id] || [],
            };
          }
          return null;
        })
        .filter(Boolean);

      return {
        ...item,
        primaryPhoto: photoMap.get(item.id),
        modifierGroups,
        canOrder: item.status === MenuItemStatus.AVAILABLE,
      };
    });

    return {
      categories,
      items: itemsWithModifiers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
