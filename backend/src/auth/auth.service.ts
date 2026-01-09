import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Users } from '../schema/user.schema';
import { Customer } from '../schema/customer.schema';
import { EmailVerificationToken } from '../schema/email-verification-token.schema';
import { SignupDto } from '../dto/sign-up.dto';
import { LoginDto } from '../dto/login.dto';
import { CustomerSignupDto } from '../dto/customer-sign-up.dto';
import { CustomerLoginDto } from '../dto/customer-login.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Users)
    private userRepo: Repository<Users>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    @InjectRepository(EmailVerificationToken)
    private emailVerificationTokenRepo: Repository<EmailVerificationToken>,
    private jwt: JwtService,
    private emailService: EmailService,
  ) {}
  async signup(dto: SignupDto) {
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new BadRequestException('Email already exists');

    const hashed = await bcrypt.hash(dto.password, 10);
    // Generate unique restaurant ID based on restaurant name and timestamp
    const baseSlug = dto.restaurantName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    const restaurantId = `${baseSlug}_${timestamp}_${random}`;
    const user = this.userRepo.create({
      email: dto.email,
      password: hashed,
      restaurantId,
      restaurantName: dto.restaurantName,
      role: 'admin', // Explicitly set admin role for all users
    });
    await this.userRepo.save(user);

    const token = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId,
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new BadRequestException('Invalid credentials');

    const validPwd = await bcrypt.compare(dto.password, user.password);
    if (!validPwd) throw new BadRequestException('Invalid credentials');

    const token = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId,
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId,
      },
    };
  }

  async googleLogin(user: any) {
    const { email, firstName, lastName } = user;
    let existingUser = await this.userRepo.findOne({ where: { email } });

    if (!existingUser) {
      // Create new user for Google login
      const baseSlug = `${firstName}${lastName}`
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 20);
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substr(2, 5);
      const restaurantId = `${baseSlug}_${timestamp}_${random}`;

      existingUser = this.userRepo.create({
        email,
        password: null, // No password for Google users
        restaurantId,
        restaurantName: `${firstName} ${lastName}'s Restaurant`,
        role: 'admin',
        firstName,
        lastName,
      });
      await this.userRepo.save(existingUser);
    }

    const token = await this.jwt.signAsync({
      sub: existingUser.id,
      email: existingUser.email,
      role: existingUser.role,
      restaurantId: existingUser.restaurantId,
    });

    return {
      access_token: token,
      user: {
        id: existingUser.id,
        email: existingUser.email,
        role: existingUser.role,
        restaurantId: existingUser.restaurantId,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
      },
    };
  }

  async customerSignup(dto: CustomerSignupDto) {
    const exists = await this.customerRepo.findOne({
      where: { email: dto.email },
    });
    if (exists) throw new BadRequestException('Email already exists');

    const hashed = await bcrypt.hash(dto.password, 10);
    const customer = this.customerRepo.create({
      email: dto.email,
      password: hashed,
      role: 'customer',
      firstName: dto.firstName,
      lastName: dto.lastName,
      isEmailVerified: false,
    });
    await this.customerRepo.save(customer);

    // Generate email verification token (valid for 24 hours)
    const verificationToken = this.generateVerificationToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await this.emailVerificationTokenRepo.save({
      customerId: customer.id,
      email: customer.email,
      token: verificationToken,
      tableToken: dto.tableToken, // Save original table token
      expiresAt,
      isUsed: false,
    });

    // Send verification email
    await this.emailService.sendVerificationEmail(
      customer.email,
      verificationToken,
      `${customer.firstName} ${customer.lastName}`,
    );

    const token = await this.jwt.signAsync({
      sub: customer.id,
      email: customer.email,
      role: customer.role,
    });

    return {
      access_token: token,
      user: {
        id: customer.id,
        email: customer.email,
        role: customer.role,
        firstName: customer.firstName,
        lastName: customer.lastName,
        isEmailVerified: customer.isEmailVerified,
      },
      message:
        'Signup successful! Please check your email to verify your account.',
      requiresEmailVerification: true,
      tableToken: dto.tableToken, // Preserve the original table token
    };
  }

  async customerLogin(dto: CustomerLoginDto) {
    const customer = await this.customerRepo.findOne({
      where: { email: dto.email },
    });
    if (!customer) throw new BadRequestException('Invalid credentials');

    const validPwd = await bcrypt.compare(dto.password, customer.password);
    if (!validPwd) throw new BadRequestException('Invalid credentials');

    const token = await this.jwt.signAsync({
      sub: customer.id,
      email: customer.email,
      role: customer.role,
    });

    return {
      access_token: token,
      user: {
        id: customer.id,
        email: customer.email,
        role: customer.role,
        firstName: customer.firstName,
        lastName: customer.lastName,
      },
    };
  }

  async customerGoogleLogin(user: any) {
    const { email, firstName, lastName, profilePictureUrl } = user;
    let existingCustomer = await this.customerRepo.findOne({
      where: { email },
    });

    if (!existingCustomer) {
      existingCustomer = this.customerRepo.create({
        email,
        password: null, // No password for Google users
        role: 'customer',
        firstName,
        lastName,
        isGoogleLogin: true,
        googleProfilePicUrl: profilePictureUrl,
      });
      await this.customerRepo.save(existingCustomer);
    } else if (!existingCustomer.isGoogleLogin) {
      // Update existing user if they're now logging in with Google
      existingCustomer.isGoogleLogin = true;
      existingCustomer.googleProfilePicUrl = profilePictureUrl;
      await this.customerRepo.save(existingCustomer);
    }

    const token = await this.jwt.signAsync({
      sub: existingCustomer.id,
      email: existingCustomer.email,
      role: existingCustomer.role,
    });

    return {
      access_token: token,
      user: {
        id: existingCustomer.id,
        email: existingCustomer.email,
        role: existingCustomer.role,
        firstName: existingCustomer.firstName,
        lastName: existingCustomer.lastName,
        isGoogleLogin: existingCustomer.isGoogleLogin,
        googleProfilePicUrl: existingCustomer.googleProfilePicUrl,
      },
    };
  }

  /**
   * Verify email using token
   */
  async verifyEmail(token: string) {
    const verificationRecord = await this.emailVerificationTokenRepo.findOne({
      where: { token },
    });

    if (!verificationRecord) {
      throw new BadRequestException('Invalid verification token');
    }

    if (verificationRecord.isUsed) {
      throw new BadRequestException('Verification token has already been used');
    }

    if (new Date() > verificationRecord.expiresAt) {
      throw new BadRequestException('Verification token has expired');
    }

    // Mark customer as verified
    const customer = await this.customerRepo.findOne({
      where: { id: verificationRecord.customerId },
    });

    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    customer.isEmailVerified = true;
    customer.emailVerifiedAt = new Date();
    await this.customerRepo.save(customer);

    // Mark token as used
    verificationRecord.isUsed = true;
    await this.emailVerificationTokenRepo.save(verificationRecord);

    // Send welcome email
    await this.emailService.sendWelcomeEmail(
      customer.email,
      `${customer.firstName} ${customer.lastName}`,
    );

    return {
      message: 'Email verified successfully!',
      success: true,
      tableToken: verificationRecord.tableToken, // Return original table token
    };
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string) {
    const customer = await this.customerRepo.findOne({ where: { email } });

    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    if (customer.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Get old verification record to preserve tableToken
    const oldRecord = await this.emailVerificationTokenRepo.findOne({
      where: { email, isUsed: false },
    });

    // Delete old verification tokens
    await this.emailVerificationTokenRepo.delete({
      email,
      isUsed: false,
    });

    // Generate new verification token
    const verificationToken = this.generateVerificationToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await this.emailVerificationTokenRepo.save({
      customerId: customer.id,
      email: customer.email,
      token: verificationToken,
      tableToken: oldRecord?.tableToken, // Preserve tableToken from old record
      expiresAt,
      isUsed: false,
    });

    // Send verification email
    await this.emailService.sendVerificationEmail(
      customer.email,
      verificationToken,
      `${customer.firstName} ${customer.lastName}`,
    );

    return {
      message: 'Verification email sent successfully',
      success: true,
      tableToken: oldRecord?.tableToken, // Return tableToken in response
    };
  }

  /**
   * Generate random verification token
   */
  private generateVerificationToken(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
