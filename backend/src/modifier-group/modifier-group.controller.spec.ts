import { Test, TestingModule } from '@nestjs/testing';
import { ModifierGroupController } from './modifier-group.controller';

describe('ModifierGroupController', () => {
  let controller: ModifierGroupController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModifierGroupController],
    }).compile();

    controller = module.get<ModifierGroupController>(ModifierGroupController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
