import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Users, UserStatus } from '../schema/user.schema';
import { Role } from '../schema/role.schema';
import { UserCredentials } from '../schema/user-credentials.schema';
import { Table } from '../schema/table.schema';
import { CreateWaiterDto } from '../dto/create-waiter.dto';
import { UpdateWaiterDto } from '../dto/update-waiter.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    @InjectRepository(UserCredentials)
    private readonly credentialsRepo: Repository<UserCredentials>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Table)
    private readonly tableRepo: Repository<Table>,
    private dataSource: DataSource,
  ) {}

  async getWaiters(restaurantId: string) {
    // Get all waiters with their assigned tables count
    const waiters = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoin('user.role', 'role')
      .leftJoin(
        Table,
        'table',
        'table.waiter_id = user.id AND table.restaurantId = :restaurantId',
        { restaurantId },
      )
      .where('role.code = :roleCode', { roleCode: 'WAITER' })
      .andWhere('user.status IN (:...statuses)', {
        statuses: [UserStatus.ACTIVE, UserStatus.SUSPENDED],
      })
      .select([
        'user.id',
        'user.email',
        'user.full_name',
        'user.avatar_url',
        'user.status',
        'user.created_at',
        'user.updated_at',
      ])
      .addSelect('COUNT(table.id)', 'assignedTablesCount')
      .addSelect('role.code', 'role_code')
      .addSelect('role.name', 'role_name')
      .groupBy('user.id')
      .addGroupBy('role.code')
      .addGroupBy('role.name')
      .orderBy('user.full_name', 'ASC')
      .getRawAndEntities();

    // Map results to include assignedTablesCount
    return waiters.entities.map((waiter, index) => ({
      id: waiter.id,
      email: waiter.email,
      full_name: waiter.full_name,
      avatar_url: waiter.avatar_url,
      status: waiter.status,
      created_at: waiter.created_at,
      updated_at: waiter.updated_at,
      role: {
        code: waiters.raw[index].role_code,
        name: waiters.raw[index].role_name,
      },
      assignedTablesCount: parseInt(waiters.raw[index].assignedTablesCount) || 0,
    }));
  }

  async getWaiterById(id: string): Promise<any> {
    const result = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoin('user.role', 'role')
      .leftJoin(Table, 'table', 'table.waiter_id = user.id')
      .where('user.id = :id', { id })
      .andWhere('role.code = :roleCode', { roleCode: 'WAITER' })
      .select([
        'user.id',
        'user.email',
        'user.full_name',
        'user.avatar_url',
        'user.status',
        'user.created_at',
        'user.updated_at',
      ])
      .addSelect('COUNT(table.id)', 'assignedTablesCount')
      .addSelect('role.code', 'role_code')
      .addSelect('role.name', 'role_name')
      .groupBy('user.id')
      .addGroupBy('role.code')
      .addGroupBy('role.name')
      .getRawAndEntities();

    if (!result.entities.length) {
      throw new NotFoundException('Waiter not found');
    }

    const waiter = result.entities[0];
    const raw = result.raw[0];

    return {
      id: waiter.id,
      email: waiter.email,
      full_name: waiter.full_name,
      avatar_url: waiter.avatar_url,
      status: waiter.status,
      created_at: waiter.created_at,
      updated_at: waiter.updated_at,
      role: {
        code: raw.role_code,
        name: raw.role_name,
      },
      assignedTablesCount: parseInt(raw.assignedTablesCount) || 0,
    };
  }

  async createWaiter(dto: CreateWaiterDto): Promise<Users> {
    // Check if email already exists
    const exists = await this.usersRepository.findOne({
      where: { email: dto.email },
    });
    if (exists) {
      throw new BadRequestException('Email already exists');
    }

    // Get WAITER role
    const waiterRole = await this.roleRepo.findOne({
      where: { code: 'WAITER' },
    });
    if (!waiterRole) {
      throw new BadRequestException('WAITER role not found');
    }

    // Create user and credentials in transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create user
      const user = this.usersRepository.create({
        email: dto.email,
        full_name: dto.full_name,
        avatar_url: dto.avatar_url,
        role_id: waiterRole.id,
        status: UserStatus.ACTIVE,
        isEmailVerified: true, // Waiter accounts are pre-verified by admin
      });
      await queryRunner.manager.save(user);

      // Create credentials
      const passwordHash = await UserCredentials.hashPassword(dto.password);
      const credentials = this.credentialsRepo.create({
        user_id: user.id,
        password_hash: passwordHash,
        password_updated_at: new Date(),
      });
      await queryRunner.manager.save(credentials);

      await queryRunner.commitTransaction();

      // Return user with role
      return this.usersRepository.findOne({
        where: { id: user.id },
        relations: ['role'],
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateWaiter(id: string, dto: UpdateWaiterDto): Promise<Users> {
    // Check if waiter exists
    const waiter = await this.usersRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!waiter || waiter.role.code !== 'WAITER') {
      throw new NotFoundException('Waiter not found');
    }

    // Check if email is being changed and if it already exists
    if (dto.email && dto.email !== waiter.email) {
      const emailExists = await this.usersRepository.findOne({
        where: { email: dto.email },
      });
      if (emailExists) {
        throw new BadRequestException('Email already exists');
      }
    }

    // Update user fields
    if (dto.email) waiter.email = dto.email;
    if (dto.full_name) waiter.full_name = dto.full_name;
    if (dto.avatar_url !== undefined) waiter.avatar_url = dto.avatar_url;

    // Update password if provided
    if (dto.password) {
      const passwordHash = await UserCredentials.hashPassword(dto.password);
      await this.credentialsRepo.update(
        { user_id: id },
        {
          password_hash: passwordHash,
          password_updated_at: new Date(),
        },
      );
    }

    // Save user
    return this.usersRepository.save(waiter);
  }

  async deleteWaiter(id: string): Promise<void> {
    const waiter = await this.usersRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!waiter || waiter.role.code !== 'WAITER') {
      throw new NotFoundException('Waiter not found');
    }

    // Soft delete - set status to DELETED
    await this.usersRepository.update(id, { status: UserStatus.DELETED });

    // Unassign from all tables
    await this.tableRepo.update({ waiter_id: id }, { waiter_id: null });
  }

  async suspendWaiter(id: string): Promise<void> {
    const waiter = await this.usersRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!waiter || waiter.role.code !== 'WAITER') {
      throw new NotFoundException('Waiter not found');
    }

    // Toggle between ACTIVE and SUSPENDED
    const newStatus =
      waiter.status === UserStatus.SUSPENDED
        ? UserStatus.ACTIVE
        : UserStatus.SUSPENDED;

    await this.usersRepository.update(id, { status: newStatus });
  }
}
