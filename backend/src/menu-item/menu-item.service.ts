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

    return this.itemRepo.save(item);
  }

  async findAll(restaurantId: string) {
    return this.itemRepo.find({
      where: {
        restaurantId,
        isDeleted: false,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, restaurantId: string, dto: UpdateMenuItemDto) {
    const item = await this.itemRepo.findOne({
      where: { id, restaurantId, isDeleted: false },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    Object.assign(item, dto);
    return this.itemRepo.save(item);
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
