import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users, UserStatus } from '../schema/user.schema';
import { Role } from '../schema/role.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
  ) {}

  async getWaiters(restaurantId: string) {
    return this.usersRepository.find({
      where: {
        status: UserStatus.ACTIVE,
        role: {
          code: 'WAITER',
        },
      },
      relations: ['role'],
      select: ['id', 'email', 'full_name', 'avatar_url'],
      order: {
        full_name: 'ASC',
      },
    });
  }
}
