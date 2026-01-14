import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuperAdminController } from './super-admin.controller';
import { SuperAdminService } from './super-admin.service';
import { SuperAdminGuard } from './guards/super-admin.guard';
import { Users } from '../schema/user.schema';
import { UserCredentials } from '../schema/user-credentials.schema';
import { Role } from '../schema/role.schema';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users, UserCredentials, Role]),
    AdminAuthModule,
  ],
  controllers: [SuperAdminController],
  providers: [SuperAdminService, SuperAdminGuard],
  exports: [SuperAdminService],
})
export class SuperAdminModule {}
