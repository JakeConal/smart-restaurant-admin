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
import { CreateAdminDto } from '../dto/create-admin.dto';
import { UpdateAdminDto } from '../dto/update-admin.dto';
import { AdminFilterDto } from '../dto/admin-filter.dto';

@Injectable()
export class SuperAdminService {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    @InjectRepository(UserCredentials)
    private readonly credentialsRepo: Repository<UserCredentials>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    private dataSource: DataSource,
  ) {}

  async getAdmins(filter: AdminFilterDto) {
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .leftJoin('user.role', 'role')
      .where('role.code = :roleCode', { roleCode: 'ADMIN' });

    // Status filter
    if (filter.status && filter.status !== 'ALL') {
      queryBuilder.andWhere('user.status = :status', { status: filter.status });
    } else {
      queryBuilder.andWhere('user.status IN (:...statuses)', {
        statuses: [UserStatus.ACTIVE, UserStatus.SUSPENDED],
      });
    }

    // Search filter
    if (filter.search) {
      queryBuilder.andWhere(
        '(user.full_name LIKE :search OR user.email LIKE :search)',
        { search: `%${filter.search}%` },
      );
    }

    // Restaurant filter
    if (filter.restaurantId) {
      queryBuilder.andWhere('user.restaurantId = :restaurantId', {
        restaurantId: filter.restaurantId,
      });
    }

    const admins = await queryBuilder
      .select([
        'user.id',
        'user.email',
        'user.full_name',
        'user.avatar_url',
        'user.status',
        'user.restaurantId',
        'user.created_at',
        'user.updated_at',
        'user.last_login_at',
        'role.code',
        'role.name',
      ])
      .orderBy('user.created_at', 'DESC')
      .getMany();

    return admins.map((admin) => ({
      id: admin.id,
      email: admin.email,
      full_name: admin.full_name,
      avatar_url: admin.avatar_url,
      status: admin.status,
      restaurantId: admin.restaurantId,
      created_at: admin.created_at,
      updated_at: admin.updated_at,
      last_login_at: admin.last_login_at,
      role: {
        code: admin.role?.code,
        name: admin.role?.name,
      },
    }));
  }

  async getAdminById(id: string) {
    const admin = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.id = :id', { id })
      .andWhere('role.code = :roleCode', { roleCode: 'ADMIN' })
      .getOne();

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return {
      id: admin.id,
      email: admin.email,
      full_name: admin.full_name,
      avatar_url: admin.avatar_url,
      status: admin.status,
      restaurantId: admin.restaurantId,
      created_at: admin.created_at,
      updated_at: admin.updated_at,
      last_login_at: admin.last_login_at,
      role: {
        code: admin.role?.code,
        name: admin.role?.name,
      },
    };
  }

  async createAdmin(dto: CreateAdminDto): Promise<Users> {
    // Check if email already exists
    const exists = await this.usersRepository.findOne({
      where: { email: dto.email },
    });
    if (exists) {
      throw new BadRequestException('Email already exists');
    }

    // Get ADMIN role
    const adminRole = await this.roleRepo.findOne({
      where: { code: 'ADMIN' },
    });
    if (!adminRole) {
      throw new BadRequestException('ADMIN role not found');
    }

    // Generate restaurantId if not provided
    const restaurantId = dto.restaurantId || this.generateRestaurantId();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = this.usersRepository.create({
        email: dto.email,
        full_name: dto.full_name,
        role_id: adminRole.id,
        status: UserStatus.ACTIVE,
        isEmailVerified: true, // Admin accounts created by Super Admin are pre-verified
        restaurantId,
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

  async updateAdmin(id: string, dto: UpdateAdminDto): Promise<Users> {
    const admin = await this.usersRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!admin || admin.role?.code !== 'ADMIN') {
      throw new NotFoundException('Admin not found');
    }

    if (dto.email && dto.email !== admin.email) {
      const emailExists = await this.usersRepository.findOne({
        where: { email: dto.email },
      });
      if (emailExists) {
        throw new BadRequestException('Email already exists');
      }
    }

    if (dto.email) admin.email = dto.email;
    if (dto.full_name) admin.full_name = dto.full_name;

    return this.usersRepository.save(admin);
  }

  async toggleAdminStatus(id: string): Promise<{ status: UserStatus }> {
    const admin = await this.usersRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!admin || admin.role?.code !== 'ADMIN') {
      throw new NotFoundException('Admin not found');
    }

    const newStatus =
      admin.status === UserStatus.SUSPENDED
        ? UserStatus.ACTIVE
        : UserStatus.SUSPENDED;

    await this.usersRepository.update(id, { status: newStatus });

    return { status: newStatus };
  }

  async deleteAdmin(id: string): Promise<void> {
    const admin = await this.usersRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!admin || admin.role?.code !== 'ADMIN') {
      throw new NotFoundException('Admin not found');
    }

    // Soft delete - set status to DELETED
    await this.usersRepository.update(id, { status: UserStatus.DELETED });
  }

  private generateRestaurantId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `rest_${timestamp}_${random}`;
  }
}
