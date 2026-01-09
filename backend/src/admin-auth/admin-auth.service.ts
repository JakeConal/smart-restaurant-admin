import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as crypto from 'crypto';
import { Users, UserStatus } from '../schema/user.schema';
import { UserCredentials } from '../schema/UserCredentials';
import { RefreshToken } from '../schema/RefreshToken';
import { Role } from '../schema/Role';
import { SignupDto } from '../dto/sign-up.dto';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectRepository(Users)
    private userRepo: Repository<Users>,
    @InjectRepository(UserCredentials)
    private credentialsRepo: Repository<UserCredentials>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepo: Repository<RefreshToken>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    private jwt: JwtService,
    private dataSource: DataSource,
  ) {}

  async signup(dto: SignupDto & { fullName: string; roleCode?: string }) {
    const exists = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (exists) throw new BadRequestException('Email already exists');

    // Get role (default to ADMIN for signup)
    const roleCode = dto.roleCode || 'ADMIN';
    const role = await this.roleRepo.findOne({ where: { code: roleCode } });
    if (!role) throw new BadRequestException('Invalid role');

    // Create user and credentials in transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create user
      const user = this.userRepo.create({
        email: dto.email,
        full_name: dto.fullName,
        role_id: role.id,
        status: UserStatus.ACTIVE,
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

      // Generate tokens
      const tokens = await this.generateTokens(user, role);

      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: role.code,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async login(
    dto: LoginDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{
    access_token: string;
    refresh_token: string;
    user: any;
  }> {
    // Find user with credentials and role
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      relations: [
        'credentials',
        'role',
        'role.rolePermissions',
        'role.rolePermissions.permission',
      ],
    });

    if (!user || !user.credentials) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (user.credentials.isLocked()) {
      throw new UnauthorizedException(
        `Account is locked. Please try again later.`,
      );
    }

    // Check account status
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    // Validate password
    const isValidPassword = await user.credentials.validatePassword(
      dto.password,
    );

    if (!isValidPassword) {
      // Increment failed login attempts
      user.credentials.incrementFailedAttempts();
      await this.credentialsRepo.save(user.credentials);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed login attempts on successful login
    user.credentials.resetFailedAttempts();
    user.last_login_at = new Date();
    await this.userRepo.save(user);
    await this.credentialsRepo.save(user.credentials);

    // Generate tokens
    const tokens = await this.generateTokens(
      user,
      user.role,
      userAgent,
      ipAddress,
    );

    // Get permissions
    const permissions = user.role.rolePermissions.map(
      (rp) => rp.permission.code,
    );

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role.code,
        permissions,
      },
    };
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    // Hash the incoming token to compare with stored hash
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    // Find the refresh token
    const storedToken = await this.refreshTokenRepo.findOne({
      where: { token_hash: tokenHash },
      relations: [
        'user',
        'user.role',
        'user.role.rolePermissions',
        'user.role.rolePermissions.permission',
      ],
    });

    if (!storedToken || !storedToken.isValid()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke the old token
    storedToken.revoke();
    await this.refreshTokenRepo.save(storedToken);

    // Generate new tokens (token rotation)
    const newTokens = await this.generateTokens(
      storedToken.user,
      storedToken.user.role,
    );

    // Link old token to new one
    const newRefreshTokenHash = crypto
      .createHash('sha256')
      .update(newTokens.refresh_token)
      .digest('hex');
    const newRefreshTokenRecord = await this.refreshTokenRepo.findOne({
      where: { token_hash: newRefreshTokenHash },
    });

    if (newRefreshTokenRecord) {
      storedToken.replaced_by_token_id = newRefreshTokenRecord.id;
      await this.refreshTokenRepo.save(storedToken);
    }

    return newTokens;
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const storedToken = await this.refreshTokenRepo.findOne({
      where: { token_hash: tokenHash },
    });

    if (storedToken) {
      storedToken.revoke();
      await this.refreshTokenRepo.save(storedToken);
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await this.refreshTokenRepo
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ revoked_at: new Date() })
      .where('user_id = :userId', { userId })
      .andWhere('revoked_at IS NULL')
      .execute();
  }

  private async generateTokens(
    user: Users,
    role: Role,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    // Load permissions if not already loaded
    let permissions: string[] = [];
    if (role.rolePermissions) {
      permissions = role.rolePermissions.map((rp) => rp.permission.code);
    } else {
      const roleWithPermissions = await this.roleRepo.findOne({
        where: { id: role.id },
        relations: ['rolePermissions', 'rolePermissions.permission'],
      });
      permissions = roleWithPermissions.rolePermissions.map(
        (rp) => rp.permission.code,
      );
    }

    // Generate access token (15 minutes)
    const accessToken = await this.jwt.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: role.code,
        permissions,
      },
      { expiresIn: (process.env.JWT_ACCESS_EXPIRY || '15m') as any },
    );

    // Generate refresh token (7 days)
    const refreshTokenValue = crypto.randomBytes(32).toString('hex');
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshTokenValue)
      .digest('hex');

    const familyId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() +
        parseInt(process.env.JWT_REFRESH_EXPIRY_DAYS || '7', 10),
    );

    const refreshToken = this.refreshTokenRepo.create({
      user_id: user.id,
      token_hash: refreshTokenHash,
      family_id: familyId,
      issued_at: new Date(),
      expires_at: expiresAt,
      user_agent: userAgent,
      ip_address: ipAddress,
    });

    await this.refreshTokenRepo.save(refreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshTokenValue,
    };
  }
}
