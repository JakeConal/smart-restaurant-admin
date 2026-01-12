import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateMenuCategoryDto } from 'src/dto/create-menu-category.dto';
import { MenuCategory, CategoryStatus } from 'src/schema/menu-category.schema';
import { Repository } from 'typeorm';
import { UpdateMenuCategoryDto } from 'src/dto/update-menu-category.dto';
import { MenuItem } from 'src/schema/menu-item.schema';

@Injectable()
export class MenuCategoryService {
  constructor(
    @InjectRepository(MenuCategory)
    private readonly CategoryRepo: Repository<MenuCategory>,
    @InjectRepository(MenuItem)
    private readonly itemRepo: Repository<MenuItem>,
  ) {}

  async create(restaurantId: string, dto: CreateMenuCategoryDto) {
    const exists = await this.CategoryRepo.findOne({
      where: { restaurantId, name: dto.name },
    });

    if (exists) {
      throw new Error('Category with this name already exists');
    }

    const category = this.CategoryRepo.create({
      restaurantId,
      ...dto,
    });

    const savedCategory = await this.CategoryRepo.save(category);

    // Calculate item count for the new category
    const itemCount = await this.itemRepo.count({
      where: {
        categoryId: savedCategory.id,
        restaurantId,
        isDeleted: false,
      },
    });

    return {
      ...savedCategory,
      itemCount,
    };
  }

  async findAll(restaurantId: string) {
    const categories = await this.CategoryRepo.find({
      where: { restaurantId, isDeleted: false },
      order: { displayOrder: 'ASC', name: 'ASC' },
    });

    // Calculate item count for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const itemCount = await this.itemRepo.count({
          where: {
            categoryId: category.id,
            restaurantId,
            isDeleted: false,
          },
        });

        return {
          ...category,
          itemCount,
        };
      }),
    );

    return categoriesWithCounts;
  }

  async update(id: string, restaurantId: string, dto: UpdateMenuCategoryDto) {
    const category = await this.CategoryRepo.findOne({
      where: { id, restaurantId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (dto.name && dto.name !== category.name) {
      const nameExists = await this.CategoryRepo.findOne({
        where: { restaurantId, name: dto.name },
      });

      if (nameExists) {
        throw new BadRequestException('Category name already exists');
      }
    }

    Object.assign(category, dto);
    const savedCategory = await this.CategoryRepo.save(category);

    // Calculate item count for the updated category
    const itemCount = await this.itemRepo.count({
      where: {
        categoryId: savedCategory.id,
        restaurantId,
        isDeleted: false,
      },
    });

    return {
      ...savedCategory,
      itemCount,
    };
  }

  async deactivate(id: string, restaurantId: string) {
    const category = await this.CategoryRepo.findOne({
      where: { id, restaurantId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    category.status = CategoryStatus.INACTIVE;
    const savedCategory = await this.CategoryRepo.save(category);

    // Calculate item count for the deactivated category
    const itemCount = await this.itemRepo.count({
      where: {
        categoryId: savedCategory.id,
        restaurantId,
        isDeleted: false,
      },
    });

    return {
      ...savedCategory,
      itemCount,
    };
  }

  async remove(id: string, restaurantId: string) {
    const category = await this.CategoryRepo.findOne({
      where: { id, restaurantId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check if category has active (not deleted) items
    const itemCount = await this.itemRepo.count({
      where: {
        categoryId: id,
        restaurantId,
        isDeleted: false,
      },
    });

    if (itemCount > 0) {
      throw new BadRequestException(
        `Cannot delete category with ${itemCount} items. Please move or delete the items first.`,
      );
    }

    // Soft delete - mark as deleted instead of removing from database
    category.isDeleted = true;
    await this.CategoryRepo.save(category);
  }
}
