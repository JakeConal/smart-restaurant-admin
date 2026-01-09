import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TableModule } from './table/table.module';
import { MenuModule } from './menu/menu.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Table } from './schema/table.schema';
import { MenuCategory } from './schema/menu-category.schema';
import { Users } from './schema/user.schema';
import { Customer } from './schema/customer.schema';
import { MenuItem } from './schema/menu-item.schema';
import { MenuItemPhoto } from './schema/menu-item-photo.schema';
import { MenuCategoryModule } from './menu-category/menu-category.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MenuItemModule } from './menu-item/menu-item.module';
import { MenuItemPhotoModule } from './menu-item-photo/menu-item-photo.module';
import { ModifierGroupModule } from './modifier-group/modifier-group.module';
import { ModifierGroup } from './schema/modifier-group.schema';
import { ModifierOption } from './schema/modifier-option.schema';
import { ModifierOptionModule } from './modifier-option/modifier-option.module';
import { MenuItemModifierModule } from './menu-item-modifier/menu-item-modifier.module';
import { MenuItemModifierGroup } from './schema/menu-item-modifier.schema';
import { ProfileModule } from './profile/profile.module';
import { ReviewModule } from './review/review.module';
import { Review } from './schema/review.schema';
import { Order } from './schema/order.schema';
import { OrderModule } from './order/order.module';
import { EmailVerificationToken } from './schema/email-verification-token.schema';
import { PasswordResetToken } from './schema/password-reset-token.schema';
import { AdminAuthModule } from './admin-auth/admin-auth.module';

// New RBAC entities
import { Role } from './schema/Role';
import { Permission } from './schema/Permission';
import { RolePermission } from './schema/RolePermission';
import { UserCredentials } from './schema/UserCredentials';
import { RefreshToken } from './schema/RefreshToken';
import { SeedModule } from './seed/seed.module';
import { SeedService } from './seed/seed.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
          // New RBAC entities
          Role,
          Permission,
          RolePermission,
          UserCredentials,
          RefreshToken,
        ],
        synchronize: true,
        // Add connection pool and retry settings
        extra: {
          connectionLimit: 10,
          acquireTimeout: 60000,
          timeout: 60000,
        },
        retryAttempts: 3,
        retryDelay: 3000,
      }),
    }),
    TableModule,
    MenuModule,
    MenuCategoryModule,
    AuthModule,
    AdminAuthModule,
    UsersModule,
    MenuItemModule,
    MenuItemPhotoModule,
    ModifierGroupModule,
    ModifierOptionModule,
    MenuItemModifierModule,
    ProfileModule,
    ReviewModule,
    OrderModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly seedService: SeedService) {}

  async onModuleInit() {
    // Run database seeder on startup
    try {
      await this.seedService.seedAll();
    } catch (error) {
      console.error('❌ Database seed failed:', error.message);
    }
  }
}
