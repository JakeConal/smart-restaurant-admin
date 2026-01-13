import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as crypto from 'crypto';
import { Users, UserStatus } from '../schema/user.schema';
import { UserCredentials } from '../schema/user-credentials.schema';
import { RefreshToken } from '../schema/refresh-token.schema';
import { Role } from '../schema/role.schema';
import { AdminEmailVerificationToken } from '../schema/admin-email-verification-token.schema';
import { AdminPasswordResetToken } from '../schema/admin-password-reset-token.schema';
import {
  AdminAuditLog,
  AdminAuditAction,
  AdminAuditStatus,
} from '../schema/admin-audit-log.schema';
import { SignupDto } from '../dto/sign-up.dto';
import { LoginDto } from '../dto/login.dto';
import { EmailService } from '../email/email.service';

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
    @InjectRepository(AdminEmailVerificationToken)
    private verificationTokenRepo: Repository<AdminEmailVerificationToken>,
    @InjectRepository(AdminPasswordResetToken)
    private resetTokenRepo: Repository<AdminPasswordResetToken>,
    @InjectRepository(AdminAuditLog)
    private auditLogRepo: Repository<AdminAuditLog>,
    private jwt: JwtService,
    private dataSource: DataSource,
    private emailService: EmailService,
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
        isEmailVerified: false, // Email not verified yet
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

      // Generate email verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

      const emailVerificationToken = this.verificationTokenRepo.create({
        userId: user.id,
        email: user.email,
        token: verificationToken,
        expiresAt,
      });
      await queryRunner.manager.save(emailVerificationToken);

      await queryRunner.commitTransaction();

      // Send verification email (async, don't block)
      this.emailService
        .sendAdminVerificationEmail(
          user.email,
          user.full_name,
          verificationToken,
        )
        .catch((err) =>
          console.error('Failed to send verification email:', err),
        );

      // Generate tokens
      const tokens = await this.generateTokens(user, role);

      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: role.code,
          isEmailVerified: false,
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

    // Check if email is verified
    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in. Check your inbox or request a new verification link.',
      );
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

  // ============= EMAIL VERIFICATION =============

  async verifyEmail(
    token: string,
    req?: Request,
  ): Promise<{ message: string }> {
    const verificationToken = await this.verificationTokenRepo.findOne({
      where: { token },
    });

    if (!verificationToken) {
      await this.createAuditLog({
        userId: null,
        action: AdminAuditAction.VERIFICATION_FAILED,
        status: AdminAuditStatus.FAILED,
        metadata: JSON.stringify({
          reason: 'Invalid token',
          token: token.substring(0, 10),
        }),
        ipAddress: (req as any)?.ip,
        userAgent: (req as any)?.headers?.['user-agent'],
      });
      throw new BadRequestException('Invalid verification token');
    }

    if (verificationToken.isUsed) {
      await this.createAuditLog({
        userId: verificationToken.userId,
        action: AdminAuditAction.VERIFICATION_FAILED,
        status: AdminAuditStatus.FAILED,
        metadata: JSON.stringify({ reason: 'Token already used' }),
        ipAddress: (req as any)?.ip,
        userAgent: (req as any)?.headers?.['user-agent'],
      });
      throw new BadRequestException('Verification token already used');
    }

    if (new Date() > verificationToken.expiresAt) {
      await this.createAuditLog({
        userId: verificationToken.userId,
        action: AdminAuditAction.VERIFICATION_FAILED,
        status: AdminAuditStatus.FAILED,
        metadata: JSON.stringify({ reason: 'Token expired' }),
        ipAddress: (req as any)?.ip,
        userAgent: (req as any)?.headers?.['user-agent'],
      });
      throw new BadRequestException('Verification token expired');
    }

    // Find user and update
    const user = await this.userRepo.findOne({
      where: { id: verificationToken.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update user verification status
    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    await this.userRepo.save(user);

    // Mark token as used
    verificationToken.isUsed = true;
    await this.verificationTokenRepo.save(verificationToken);

    // Create audit log
    await this.createAuditLog({
      userId: user.id,
      action: AdminAuditAction.EMAIL_VERIFIED,
      status: AdminAuditStatus.SUCCESS,
      metadata: JSON.stringify({ email: user.email }),
      ipAddress: (req as any)?.ip,
      userAgent: (req as any)?.headers?.['user-agent'],
    });

    return { message: 'Email verified successfully' };
  }

  async resendVerification(
    email: string,
    req?: Request,
  ): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Invalidate old tokens
    await this.verificationTokenRepo
      .createQueryBuilder()
      .update(AdminEmailVerificationToken)
      .set({ isUsed: true })
      .where('userId = :userId', { userId: user.id })
      .andWhere('isUsed = :isUsed', { isUsed: false })
      .execute();

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    const emailVerificationToken = this.verificationTokenRepo.create({
      userId: user.id,
      email: user.email,
      token: verificationToken,
      expiresAt,
    });
    await this.verificationTokenRepo.save(emailVerificationToken);

    // Send verification email
    await this.emailService.sendAdminVerificationEmail(
      user.email,
      user.full_name,
      verificationToken,
    );

    // Create audit log
    await this.createAuditLog({
      userId: user.id,
      action: AdminAuditAction.VERIFICATION_SENT,
      status: AdminAuditStatus.SUCCESS,
      metadata: JSON.stringify({ email: user.email }),
      ipAddress: (req as any)?.ip,
      userAgent: (req as any)?.headers?.['user-agent'],
    });

    return { message: 'Verification email sent' };
  }

  // ============= PASSWORD RESET =============

  async forgotPassword(
    email: string,
    req?: Request,
  ): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if user exists
      return {
        message: 'If the email exists, a password reset link has been sent',
      };
    }

    // Check account status
    if (user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('Account is not active');
    }

    // Invalidate old reset tokens
    await this.resetTokenRepo
      .createQueryBuilder()
      .update(AdminPasswordResetToken)
      .set({ isUsed: true })
      .where('userId = :userId', { userId: user.id })
      .andWhere('isUsed = :isUsed', { isUsed: false })
      .execute();

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 minutes expiry

    const passwordResetToken = this.resetTokenRepo.create({
      userId: user.id,
      email: user.email,
      token: resetToken,
      expiresAt,
    });
    await this.resetTokenRepo.save(passwordResetToken);

    // Send reset email
    await this.emailService.sendAdminPasswordResetEmail(
      user.email,
      user.full_name,
      resetToken,
    );

    // Create audit log
    await this.createAuditLog({
      userId: user.id,
      action: AdminAuditAction.RESET_TOKEN_SENT,
      status: AdminAuditStatus.SUCCESS,
      metadata: JSON.stringify({ email: user.email }),
      ipAddress: (req as any)?.ip,
      userAgent: (req as any)?.headers?.['user-agent'],
    });

    return {
      message: 'If the email exists, a password reset link has been sent',
    };
  }

  async resetPassword(
    token: string,
    newPassword: string,
    req?: Request,
  ): Promise<{ message: string }> {
    const resetToken = await this.resetTokenRepo.findOne({
      where: { token },
    });

    if (!resetToken) {
      await this.createAuditLog({
        userId: null,
        action: AdminAuditAction.RESET_FAILED,
        status: AdminAuditStatus.FAILED,
        metadata: JSON.stringify({
          reason: 'Invalid token',
          token: token.substring(0, 10),
        }),
        ipAddress: (req as any)?.ip,
        userAgent: (req as any)?.headers?.['user-agent'],
      });
      throw new BadRequestException('Invalid reset token');
    }

    if (resetToken.isUsed) {
      await this.createAuditLog({
        userId: resetToken.userId,
        action: AdminAuditAction.RESET_FAILED,
        status: AdminAuditStatus.FAILED,
        metadata: JSON.stringify({ reason: 'Token already used' }),
        ipAddress: (req as any)?.ip,
        userAgent: (req as any)?.headers?.['user-agent'],
      });
      throw new BadRequestException('Reset token already used');
    }

    if (new Date() > resetToken.expiresAt) {
      await this.createAuditLog({
        userId: resetToken.userId,
        action: AdminAuditAction.RESET_FAILED,
        status: AdminAuditStatus.FAILED,
        metadata: JSON.stringify({ reason: 'Token expired' }),
        ipAddress: (req as any)?.ip,
        userAgent: (req as any)?.headers?.['user-agent'],
      });
      throw new BadRequestException('Reset token expired');
    }

    // Find user and credentials
    const user = await this.userRepo.findOne({
      where: { id: resetToken.userId },
      relations: ['credentials'],
    });

    if (!user || !user.credentials) {
      throw new NotFoundException('User not found');
    }

    // Update password
    const passwordHash = await UserCredentials.hashPassword(newPassword);
    user.credentials.password_hash = passwordHash;
    user.credentials.password_updated_at = new Date();
    user.credentials.resetFailedAttempts(); // Reset failed attempts
    await this.credentialsRepo.save(user.credentials);

    // Mark token as used
    resetToken.isUsed = true;
    await this.resetTokenRepo.save(resetToken);

    // Invalidate all refresh tokens (logout all sessions)
    await this.logoutAll(user.id);

    // Create audit log
    await this.createAuditLog({
      userId: user.id,
      action: AdminAuditAction.PASSWORD_RESET,
      status: AdminAuditStatus.SUCCESS,
      metadata: JSON.stringify({ email: user.email }),
      ipAddress: (req as any)?.ip,
      userAgent: (req as any)?.headers?.['user-agent'],
    });

    return {
      message:
        'Password reset successfully. Please login with your new password.',
    };
  }

  // ============= AUDIT LOG =============

  private async createAuditLog(data: {
    userId: string | null;
    action: AdminAuditAction;
    status: AdminAuditStatus;
    metadata?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      const auditLog = this.auditLogRepo.create({
        userId: data.userId,
        action: data.action,
        status: data.status,
        metadata: data.metadata,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      });
      await this.auditLogRepo.save(auditLog);
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }
}
