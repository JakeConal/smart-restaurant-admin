import { Test, TestingModule } from '@nestjs/testing';
import { MenuItemPhotoController } from './menu-item-photo.controller';

describe('MenuItemPhotoController', () => {
  let controller: MenuItemPhotoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MenuItemPhotoController],
    }).compile();

    controller = module.get<MenuItemPhotoController>(MenuItemPhotoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
