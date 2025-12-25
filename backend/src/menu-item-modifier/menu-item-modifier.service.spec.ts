import { Test, TestingModule } from '@nestjs/testing';
import { MenuItemModifierService } from './menu-item-modifier.service';

describe('MenuItemModifierService', () => {
  let service: MenuItemModifierService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MenuItemModifierService],
    }).compile();

    service = module.get<MenuItemModifierService>(MenuItemModifierService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
