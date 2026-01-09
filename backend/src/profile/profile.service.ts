import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../schema/customer.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
  ) {}

  async getProfile(customerId: string) {
    const customer = await this.customerRepo.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      dateOfBirth: customer.dateOfBirth,
      phoneNumber: customer.phoneNumber,
      googleId: customer.googleId,
      isGoogleLogin: customer.isGoogleLogin,
      googleProfilePicUrl: customer.googleProfilePicUrl,
      hasProfilePicture: !!customer.profilePicture,
    };
  }

  async updateProfile(
    customerId: string,
    updateData: {
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string;
      phoneNumber?: string;
    },
  ) {
    const customer = await this.customerRepo.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Update allowed fields
    if (updateData.firstName) customer.firstName = updateData.firstName;
    if (updateData.lastName) customer.lastName = updateData.lastName;
    if (updateData.dateOfBirth) customer.dateOfBirth = updateData.dateOfBirth;
    if (updateData.phoneNumber) customer.phoneNumber = updateData.phoneNumber;

    await this.customerRepo.save(customer);

    return {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      dateOfBirth: customer.dateOfBirth,
      phoneNumber: customer.phoneNumber,
    };
  }

  async uploadProfilePicture(customerId: string, file: Buffer) {
    if (!file || file.length === 0) {
      throw new BadRequestException('No file provided');
    }

    const customer = await this.customerRepo.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    customer.profilePicture = file;
    await this.customerRepo.save(customer);

    return {
      message: 'Profile picture updated successfully',
      id: customer.id,
    };
  }

  async getProfilePicture(customerId: string) {
    if (!customerId) {
      throw new NotFoundException('Customer ID is required');
    }

    const customer = await this.customerRepo.findOne({
      where: { id: customerId },
      select: ['id', 'profilePicture'], // Only select necessary columns
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Explicitly check if profilePicture exists and is not empty
    if (!customer.profilePicture) {
      throw new NotFoundException('Profile picture not found');
    }

    // Additional safety check for buffer
    if (Buffer.isBuffer(customer.profilePicture)) {
      if (customer.profilePicture.length === 0) {
        throw new NotFoundException('Profile picture not found');
      }
    } else if (!customer.profilePicture) {
      throw new NotFoundException('Profile picture not found');
    }

    return customer.profilePicture;
  }

  async updatePassword(
    customerId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const customer = await this.customerRepo.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Check if account is a Google login account (using isGoogleLogin flag)
    if (customer.isGoogleLogin) {
      throw new BadRequestException(
        'Cannot change password for Google login accounts',
      );
    }

    // Check if customer has a password (for non-Google accounts)
    if (!customer.password) {
      throw new BadRequestException(
        'Account does not have a password. Please use forgot password to set one.',
      );
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      customer.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Validate new password is different from current
    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    customer.password = hashedPassword;

    // Save to database
    await this.customerRepo.save(customer);

    return {
      message: 'Password changed successfully',
      id: customer.id,
    };
  }
}
