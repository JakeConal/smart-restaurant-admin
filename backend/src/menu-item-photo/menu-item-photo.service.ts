import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuItem } from '../schema/menu-item.schema';
import { MenuItemPhoto } from '../schema/menu-item-photo.schema';

@Injectable()
export class MenuItemPhotoService {
  constructor(
    @InjectRepository(MenuItem)
    private readonly itemRepo: Repository<MenuItem>,
    @InjectRepository(MenuItemPhoto)
    private readonly photoRepo: Repository<MenuItemPhoto>,
  ) {}

  async getPhoto(itemId: string, photoId: string) {
    const photo = await this.photoRepo.findOne({
      where: { id: photoId, menuItemId: itemId },
    });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    return photo;
  }

  async getPhotos(itemId: string) {
    return this.photoRepo.find({
      where: { menuItemId: itemId },
      order: { isPrimary: 'DESC', createdAt: 'ASC' },
    });
  }

  async addPhotos(
    restaurantId: string,
    itemId: string,
    files: Express.Multer.File[],
  ) {
    const item = await this.itemRepo.findOne({
      where: { id: itemId, restaurantId, isDeleted: false },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    const photos = files.map((file: Express.Multer.File, index: number) =>
      this.photoRepo.create({
        menuItemId: itemId,
        data: file.buffer,
        mimeType: file.mimetype,
        isPrimary: index === 0, // first = primary
      }),
    );

    return this.photoRepo.save(photos);
  }

  async removePhoto(restaurantId: string, itemId: string, photoId: string) {
    const photo = await this.photoRepo.findOne({
      where: { id: photoId, menuItemId: itemId },
    });

    if (!photo) throw new NotFoundException();

    return this.photoRepo.remove(photo);
  }

  async setPrimaryPhoto(restaurantId: string, itemId: string, photoId: string) {
    await this.photoRepo.update({ menuItemId: itemId }, { isPrimary: false });

    await this.photoRepo.update(
      { id: photoId, menuItemId: itemId },
      { isPrimary: true },
    );

    return { message: 'Primary photo updated' };
  }
}
