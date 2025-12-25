import { Test, TestingModule } from '@nestjs/testing';
import { MenuItemPhotoService } from './menu-item-photo.service';

describe('MenuItemPhotoService', () => {
  let service: MenuItemPhotoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MenuItemPhotoService],
    }).compile();

    service = module.get<MenuItemPhotoService>(MenuItemPhotoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
