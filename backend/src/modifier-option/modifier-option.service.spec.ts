import { Test, TestingModule } from '@nestjs/testing';
import { ModifierOptionService } from './modifier-option.service';

describe('ModifierOptionService', () => {
  let service: ModifierOptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ModifierOptionService],
    }).compile();

    service = module.get<ModifierOptionService>(ModifierOptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
