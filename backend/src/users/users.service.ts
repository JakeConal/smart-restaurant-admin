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
import { CreateKitchenStaffDto } from '../dto/create-kitchen-staff.dto';
import { UpdateKitchenStaffDto } from '../dto/update-kitchen-staff.dto';

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

  // ============= KITCHEN STAFF METHODS =============

  async getKitchenStaff(restaurantId: string) {
    const staff = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoin('user.role', 'role')
      .where('role.code = :roleCode', { roleCode: 'KITCHEN' })
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
      .addSelect('role.code', 'role_code')
      .addSelect('role.name', 'role_name')
      .orderBy('user.full_name', 'ASC')
      .getRawAndEntities();

    return staff.entities.map((member, index) => ({
      id: member.id,
      email: member.email,
      full_name: member.full_name,
      avatar_url: member.avatar_url,
      status: member.status,
      created_at: member.created_at,
      updated_at: member.updated_at,
      role: {
        code: staff.raw[index].role_code,
        name: staff.raw[index].role_name,
      },
    }));
  }

  async getKitchenStaffById(id: string): Promise<any> {
    const result = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoin('user.role', 'role')
      .where('user.id = :id', { id })
      .andWhere('role.code = :roleCode', { roleCode: 'KITCHEN' })
      .select([
        'user.id',
        'user.email',
        'user.full_name',
        'user.avatar_url',
        'user.status',
        'user.created_at',
        'user.updated_at',
      ])
      .addSelect('role.code', 'role_code')
      .addSelect('role.name', 'role_name')
      .getRawAndEntities();

    if (!result.entities.length) {
      throw new NotFoundException('Kitchen staff not found');
    }

    const staff = result.entities[0];
    const raw = result.raw[0];

    return {
      id: staff.id,
      email: staff.email,
      full_name: staff.full_name,
      avatar_url: staff.avatar_url,
      status: staff.status,
      created_at: staff.created_at,
      updated_at: staff.updated_at,
      role: {
        code: raw.role_code,
        name: raw.role_name,
      },
    };
  }

  async createKitchenStaff(dto: CreateKitchenStaffDto): Promise<Users> {
    const exists = await this.usersRepository.findOne({
      where: { email: dto.email },
    });
    if (exists) {
      throw new BadRequestException('Email already exists');
    }

    const kitchenRole = await this.roleRepo.findOne({
      where: { code: 'KITCHEN' },
    });
    if (!kitchenRole) {
      throw new BadRequestException('KITCHEN role not found');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = this.usersRepository.create({
        email: dto.email,
        full_name: dto.full_name,
        avatar_url: dto.avatar_url,
        role_id: kitchenRole.id,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      });
      await queryRunner.manager.save(user);

      const passwordHash = await UserCredentials.hashPassword(dto.password);
      const credentials = this.credentialsRepo.create({
        user_id: user.id,
        password_hash: passwordHash,
        password_updated_at: new Date(),
      });
      await queryRunner.manager.save(credentials);

      await queryRunner.commitTransaction();

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

  async updateKitchenStaff(
    id: string,
    dto: UpdateKitchenStaffDto,
  ): Promise<Users> {
    const staff = await this.usersRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!staff || staff.role.code !== 'KITCHEN') {
      throw new NotFoundException('Kitchen staff not found');
    }

    if (dto.email && dto.email !== staff.email) {
      const emailExists = await this.usersRepository.findOne({
        where: { email: dto.email },
      });
      if (emailExists) {
        throw new BadRequestException('Email already exists');
      }
    }

    if (dto.email) staff.email = dto.email;
    if (dto.full_name) staff.full_name = dto.full_name;
    if (dto.avatar_url !== undefined) staff.avatar_url = dto.avatar_url;

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

    return this.usersRepository.save(staff);
  }

  async deleteKitchenStaff(id: string): Promise<void> {
    const staff = await this.usersRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!staff || staff.role.code !== 'KITCHEN') {
      throw new NotFoundException('Kitchen staff not found');
    }

    await this.usersRepository.update(id, { status: UserStatus.DELETED });
  }

  async suspendKitchenStaff(id: string): Promise<void> {
    const staff = await this.usersRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!staff || staff.role.code !== 'KITCHEN') {
      throw new NotFoundException('Kitchen staff not found');
    }

    const newStatus =
      staff.status === UserStatus.SUSPENDED
        ? UserStatus.ACTIVE
        : UserStatus.SUSPENDED;

    await this.usersRepository.update(id, { status: newStatus });
  }
}
