import { Test, TestingModule } from '@nestjs/testing';
import { CustomerAuthController } from './customer-auth.controller';
import { CustomerAuthService } from './customer-auth.service';
import { ConfigService } from '@nestjs/config';

describe('CustomerAuthController', () => {
  let controller: CustomerAuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerAuthController],
      providers: [
        {
          provide: CustomerAuthService,
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CustomerAuthController>(CustomerAuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
