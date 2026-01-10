import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Role } from '../schema/role.schema';
import { Permission } from '../schema/permission.schema';
import { RolePermission } from '../schema/role-permission.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, Permission, RolePermission]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
