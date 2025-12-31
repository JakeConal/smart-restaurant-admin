import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MenuCategory, CategoryStatus } from 'src/schema/menu-category.schema';
import { MenuItem } from 'src/schema/menu-item.schema';
import { Repository } from 'typeorm';
import { CreateMenuItemDto } from '../dto/create-menu-item.dto';
import { UpdateMenuItemDto } from '../dto/update-menu-item.dto';

@Injectable()
export class MenuItemService {
  constructor(
    @InjectRepository(MenuCategory)
    private readonly categoryRepo: Repository<MenuCategory>,

    @InjectRepository(MenuItem)
    private readonly itemRepo: Repository<MenuItem>,
  ) {}

  async create(restaurantId: string, dto: CreateMenuItemDto) {
    const category = await this.categoryRepo.findOne({
      where: {
        id: dto.categoryId,
        restaurantId,
        status: CategoryStatus.ACTIVE,
      },
    });

    if (!category) {
      throw new BadRequestException('Invalid category');
    }

    const item = this.itemRepo.create({
      ...dto,
      restaurantId,
    });

    const savedItem = await this.itemRepo.save(item);

    // Load the category relation for the response
    const itemWithCategory = await this.itemRepo.findOne({
      where: { id: savedItem.id },
      relations: ['category'],
    });

    return {
      ...itemWithCategory,
      categoryName: itemWithCategory?.category?.name,
    };
  }

  async findAll(
    restaurantId: string,
    filters?: {
      search?: string;
      categoryId?: string;
      status?: string;
      chefRecommended?: boolean;
      sortBy?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const queryBuilder = this.itemRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category')
      .leftJoinAndSelect('item.photos', 'photos')
      .leftJoinAndSelect('item.modifierGroups', 'modifierGroups')
      .leftJoinAndSelect('modifierGroups.options', 'options')
      .where('item.restaurantId = :restaurantId', { restaurantId })
      .andWhere('item.isDeleted = :isDeleted', { isDeleted: false });

    // Apply filters
    if (filters?.search) {
      queryBuilder.andWhere(
        'item.name LIKE :search OR item.description LIKE :search',
        {
          search: `%${filters.search}%`,
        },
      );
    }

    if (filters?.categoryId) {
      queryBuilder.andWhere('item.categoryId = :categoryId', {
        categoryId: filters.categoryId,
      });
    }

    if (filters?.status) {
      queryBuilder.andWhere('item.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.chefRecommended !== undefined) {
      queryBuilder.andWhere('item.isChefRecommended = :chefRecommended', {
        chefRecommended: filters.chefRecommended,
      });
    }

    // Apply sorting
    const sortBy = filters?.sortBy || 'createdAt';
    const sortOrder = sortBy === 'price' ? 'ASC' : 'DESC';
    queryBuilder.orderBy(`item.${sortBy}`, sortOrder);

    // Apply pagination
    const page = filters?.page || 1;
    const limit = filters?.limit && !isNaN(filters.limit) ? filters.limit : 12;
    const offset = (page - 1) * limit;

    queryBuilder.skip(offset).take(limit);

    // Get total count
    const totalQuery = this.itemRepo
      .createQueryBuilder('item')
      .where('item.restaurantId = :restaurantId', { restaurantId })
      .andWhere('item.isDeleted = :isDeleted', { isDeleted: false });

    // Apply same filters to total count
    if (filters?.search) {
      totalQuery.andWhere(
        'item.name LIKE :search OR item.description LIKE :search',
        {
          search: `%${filters.search}%`,
        },
      );
    }

    if (filters?.categoryId) {
      totalQuery.andWhere('item.categoryId = :categoryId', {
        categoryId: filters.categoryId,
      });
    }

    if (filters?.status) {
      totalQuery.andWhere('item.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.chefRecommended !== undefined) {
      totalQuery.andWhere('item.isChefRecommended = :chefRecommended', {
        chefRecommended: filters.chefRecommended,
      });
    }

    const [items, total] = await Promise.all([
      queryBuilder.getMany(),
      totalQuery.getCount(),
    ]);

    // Transform items to include categoryName as flat field
    const transformedItems = items.map((item) => ({
      ...item,
      categoryName: item.category?.name,
      primaryPhotoId: item.photos?.find((p) => p.isPrimary)?.id,
    }));

    return { items: transformedItems, total };
  }

  async findOne(id: string, restaurantId: string) {
    const item = await this.itemRepo.findOne({
      where: { id, restaurantId, isDeleted: false },
      relations: [
        'category',
        'photos',
        'modifierGroups',
        'modifierGroups.options',
      ],
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    return {
      ...item,
      categoryName: item.category?.name,
      primaryPhotoId: item.photos?.find((p) => p.isPrimary)?.id,
    };
  }

  async update(id: string, restaurantId: string, dto: UpdateMenuItemDto) {
    const item = await this.itemRepo.findOne({
      where: { id, restaurantId, isDeleted: false },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    Object.assign(item, dto);
    const savedItem = await this.itemRepo.save(item);

    // Load the category relation for the response
    const itemWithCategory = await this.itemRepo.findOne({
      where: { id: savedItem.id },
      relations: ['category'],
    });

    return {
      ...itemWithCategory,
      categoryName: itemWithCategory?.category?.name,
    };
  }

  async updateStatus(
    id: string,
    restaurantId: string,
    status: 'available' | 'unavailable' | 'sold_out',
  ) {
    const item = await this.itemRepo.findOne({
      where: { id, restaurantId, isDeleted: false },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    item.status = status as any; // Type assertion since enum values match
    const savedItem = await this.itemRepo.save(item);

    // Load the category relation for the response
    const itemWithCategory = await this.itemRepo.findOne({
      where: { id: savedItem.id },
      relations: ['category'],
    });

    return {
      ...itemWithCategory,
      categoryName: itemWithCategory?.category?.name,
    };
  }

  async remove(id: string, restaurantId: string) {
    const item = await this.itemRepo.findOne({
      where: { id, restaurantId },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    item.isDeleted = true;
    return this.itemRepo.save(item);
  }

  async incrementPopularity(id: string, restaurantId: string) {
    const item = await this.itemRepo.findOne({
      where: { id, restaurantId, isDeleted: false },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    item.popularityScore += 1;
    return this.itemRepo.save(item);
  }
}
