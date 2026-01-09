import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Role } from '../schema/Role';
import { Permission } from '../schema/Permission';
import { RolePermission } from '../schema/RolePermission';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, Permission, RolePermission]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
