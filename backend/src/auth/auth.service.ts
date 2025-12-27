import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Users } from '../schema/user.schema';
import { SignupDto } from '../dto/sign-up.dto';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Users)
    private userRepo: Repository<Users>,
    private jwt: JwtService,
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
}
