import { Test, TestingModule } from '@nestjs/testing';
import { MenuItemModifierController } from './menu-item-modifier.controller';

describe('MenuItemModifierController', () => {
  let controller: MenuItemModifierController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MenuItemModifierController],
    }).compile();

    controller = module.get<MenuItemModifierController>(MenuItemModifierController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
