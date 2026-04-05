import { Test, TestingModule } from '@nestjs/testing';
import { CustomerAuthService } from './customer-auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import { Customer } from './entities/customer.schema';
import { EmailVerificationToken } from './entities/email-verification-token.schema';
import { PasswordResetToken } from './entities/password-reset-token.schema';

describe('CustomerAuthService', () => {
  let service: CustomerAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerAuthService,
        {
          provide: getRepositoryToken(Customer),
          useValue: {},
        },
        {
          provide: getRepositoryToken(EmailVerificationToken),
          useValue: {},
        },
        {
          provide: getRepositoryToken(PasswordResetToken),
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: {},
        },
        {
          provide: EmailService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<CustomerAuthService>(CustomerAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
