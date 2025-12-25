import { Test, TestingModule } from '@nestjs/testing';
import { ModifierOptionController } from './modifier-option.controller';

describe('ModifierOptionController', () => {
  let controller: ModifierOptionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModifierOptionController],
    }).compile();

    controller = module.get<ModifierOptionController>(ModifierOptionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
