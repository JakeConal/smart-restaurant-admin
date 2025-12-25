import { Test, TestingModule } from '@nestjs/testing';
import { ModifierGroupService } from './modifier-group.service';

describe('ModifierGroupService', () => {
  let service: ModifierGroupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ModifierGroupService],
    }).compile();

    service = module.get<ModifierGroupService>(ModifierGroupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
