import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TableModule } from './table/table.module';
import { MenuModule } from './menu/menu.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { Table } from './table/entities/table.entity';
import { MenuCategory } from './menu/entities/menu-category.entity';
import { Users } from './users/entities/user.schema';
import { Customer } from './customer-auth/entities/customer.schema';
import { MenuItem } from './menu/entities/menu-item.entity';
import { MenuItemPhoto } from './menu/entities/menu-item-photo.entity';
import { CustomerAuthModule } from './customer-auth/customer-auth.module';
import { UsersModule } from './users/users.module';
import { ModifierGroup } from './menu/entities/modifier-group.entity';
import { ModifierOption } from './menu/entities/modifier-option.entity';
import { MenuItemModifierGroup } from './menu/entities/menu-item-modifier.entity';
import { ProfileModule } from './profile/profile.module';
import { ReviewModule } from './review/review.module';
import { Review } from './review/entities/review.schema';
import { Order } from './order/entities/order.entity';
import { OrderModule } from './order/order.module';
import { EmailVerificationToken } from './customer-auth/entities/email-verification-token.schema';
import { PasswordResetToken } from './customer-auth/entities/password-reset-token.schema';
import { AdminEmailVerificationToken } from './admin-auth/entities/admin-email-verification-token.schema';
import { AdminPasswordResetToken } from './admin-auth/entities/admin-password-reset-token.schema';
import { AdminAuditLog } from './admin-auth/entities/admin-audit-log.schema';
import { AdminAuthModule } from './admin-auth/admin-auth.module';

// New RBAC entities
import { Role } from './users/entities/role.schema';
import { Permission } from './users/entities/permission.schema';
import { RolePermission } from './users/entities/role-permission.schema';
import { UserCredentials } from './users/entities/user-credentials.schema';
import { RefreshToken } from './admin-auth/entities/refresh-token.schema';
import { WaiterModule } from './waiter/waiter.module';
import { ManagerModule } from './manager/manager.module';
import { KitchenModule } from './kitchen/kitchen.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({
      isGlobal: true,
      ttl: 60000, // 1 minute default TTL
      max: 100, // maximum number of items in cache
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: [
          Table,
          MenuCategory,
          Users,
          Customer,
          MenuItem,
          MenuItemPhoto,
          ModifierGroup,
          ModifierOption,
          MenuItemModifierGroup,
          Review,
          Order,
          EmailVerificationToken,
          PasswordResetToken,
          // Admin auth entities
          AdminEmailVerificationToken,
          AdminPasswordResetToken,
          AdminAuditLog,
          // New RBAC entities
          Role,
          Permission,
          RolePermission,
          UserCredentials,
          RefreshToken,
        ],
        timezone: 'Z',
        synchronize: true,
        // Add connection pool and retry settings
        extra: {
          connectionLimit: 20,
          idleTimeout: 30000,
          enableKeepAlive: true,
          keepAliveInitialDelay: 10000,
          acquireTimeout: 60000,
        },
        retryAttempts: 3,
        retryDelay: 3000,
      }),
    }),
    TableModule,
    MenuModule,
    CustomerAuthModule,
    AdminAuthModule,
    UsersModule,
    ProfileModule,
    ReviewModule,
    OrderModule,
    WaiterModule,
    ManagerModule,
    KitchenModule,
    SuperAdminModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

