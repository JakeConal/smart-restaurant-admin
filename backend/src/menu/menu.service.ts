import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
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
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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

    // 1. Try to get from cache first for high performance
    const cacheKey = `guest_menu:${restaurantId}:${q || ''}:${categoryId || ''}:${sort || ''}:${chefRecommended}:${page}:${limit}`;
    const cachedResult = await this.cacheManager.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // 2. Cache categories list for 5 minutes as it rarely changes
    const categoryCacheKey = `categories:${restaurantId}`;
    let categories =
      await this.cacheManager.get<MenuCategory[]>(categoryCacheKey);

    if (!categories) {
      categories = await this.categoryRepo.find({
        where: { restaurantId, status: CategoryStatus.ACTIVE },
        order: { name: 'ASC' },
        select: ['id', 'name', 'description', 'restaurantId', 'status'], // Only necessary fields
      });
      await this.cacheManager.set(categoryCacheKey, categories, 300000); // 5 mins
    }

    // Build where conditions for items
    const where: any = {
      restaurantId,
      isDeleted: false,
    };
    if (categoryId) where.categoryId = categoryId;
    if (chefRecommended !== undefined)
      where.isChefRecommended = chefRecommended;
    if (q) where.name = Like(`%${q}%`);

    // Sort options
    let order: any = { name: 'ASC' };
    if (sort === 'popularity') {
      order = { popularityScore: 'DESC', name: 'ASC' };
    } else if (sort === 'asc') {
      order = { price: 'ASC', name: 'ASC' };
    } else if (sort === 'desc') {
      order = { price: 'DESC', name: 'ASC' };
    }

    // 3. Get items with pagination - selecting only needed fields
    const [items, total] = await this.itemRepo.findAndCount({
      where,
      order,
      skip: (page - 1) * limit,
      take: limit,
      select: [
        'id',
        'name',
        'price',
        'description',
        'status',
        'isChefRecommended',
        'categoryId',
        'prepTimeMinutes',
      ],
    });

    if (items.length === 0) {
      const emptyResult = { categories, items: [], total, page, limit };
      await this.cacheManager.set(cacheKey, emptyResult, 60000);
      return emptyResult;
    }

    // Get item IDs
    const itemIds = items.map((item) => item.id);

    // 4. Fetch photos (EXCLUDING data BLOB) and modifier groups with options in parallel
    const [allPhotos, itemModifiers] = await Promise.all([
      this.photoRepo.find({
        where: { menuItemId: In(itemIds) },
        order: { isPrimary: 'DESC', createdAt: 'ASC' },
        select: ['id', 'menuItemId', 'mimeType', 'isPrimary', 'createdAt'],
      }),
      this.itemModifierRepo.find({
        where: { menuItemId: In(itemIds) },
        relations: ['group', 'group.options'],
      }),
    ]);

    // Group photos by menuItemId and prepare URLs
    const photosByItem = new Map<string, any[]>();
    const photoMap = new Map<string, string>();
    const baseUrl = process.env.API_BASE_URL || '';

    allPhotos.forEach((photo) => {
      const photoUrl = `/api/menu/items/${photo.menuItemId}/photos/${photo.id}`;

      if (!photosByItem.has(photo.menuItemId)) {
        photosByItem.set(photo.menuItemId, []);
      }

      const photoData = {
        id: photo.id,
        menuItemId: photo.menuItemId,
        data: photoUrl,
        mimeType: photo.mimeType,
        isPrimary: photo.isPrimary,
        createdAt:
          photo.createdAt instanceof Date
            ? photo.createdAt.toISOString()
            : photo.createdAt,
      };

      photosByItem.get(photo.menuItemId)!.push(photoData);

      if (photo.isPrimary && !photoMap.has(photo.menuItemId)) {
        photoMap.set(photo.menuItemId, photoUrl);
      }
    });

    // Group modifiers by item ID
    const modifiersByItem = new Map<string, any[]>();
    itemModifiers.forEach((im) => {
      if (!im.group) return;
      if (!modifiersByItem.has(im.menuItemId)) {
        modifiersByItem.set(im.menuItemId, []);
      }

      modifiersByItem.get(im.menuItemId)!.push({
        ...im.group,
        options: im.group.options || [],
      });
    });

    // Attach modifiers and photos to items
    const itemsWithModifiers = items.map((item) => {
      const itemPhotos = photosByItem.get(item.id) || [];
      const primaryPhotoUrl =
        photoMap.get(item.id) ||
        (itemPhotos.length > 0 ? itemPhotos[0].data : null);

      return {
        ...item,
        photo: primaryPhotoUrl,
        primaryPhotoUrl,
        photos: itemPhotos,
        modifierGroups: modifiersByItem.get(item.id) || [],
        canOrder: item.status === MenuItemStatus.AVAILABLE,
      };
    });

    const finalResult = {
      categories,
      items: itemsWithModifiers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Store in cache for 1 minute
    await this.cacheManager.set(cacheKey, finalResult, 60000);

    return finalResult;
  }

  async getMenuItemPhoto(photoId: string) {
    return this.photoRepo.findOne({
      where: { id: photoId },
      select: ['id', 'data', 'mimeType'],
    });
  }

  async getGuestMenuItem(itemId: string) {
    const item = await this.itemRepo.findOne({
      where: { id: itemId, isDeleted: false },
      select: [
        'id',
        'name',
        'price',
        'description',
        'status',
        'isChefRecommended',
        'categoryId',
        'prepTimeMinutes',
        'restaurantId',
      ],
    });

    if (!item) return null;

    const [photos, modifierGroups] = await Promise.all([
      this.photoRepo.find({
        where: { menuItemId: itemId },
        order: { isPrimary: 'DESC', createdAt: 'ASC' },
        select: ['id', 'mimeType', 'isPrimary'],
      }),
      this.itemModifierRepo.find({
        where: { menuItemId: itemId },
        relations: ['group', 'group.options'],
      }),
    ]);

    const formattedPhotos = photos.map((p) => ({
      ...p,
      data: `/api/menu/items/${itemId}/photos/${p.id}`,
    }));

    const primaryPhoto =
      formattedPhotos.find((p) => p.isPrimary) || formattedPhotos[0];

    return {
      ...item,
      photos: formattedPhotos,
      primaryPhotoUrl: primaryPhoto ? primaryPhoto.data : null,
      modifierGroups: modifierGroups.map((mg) => ({
        ...mg.group,
        options: mg.group.options || [],
      })),
      canOrder: item.status === MenuItemStatus.AVAILABLE,
    };
  }
}
