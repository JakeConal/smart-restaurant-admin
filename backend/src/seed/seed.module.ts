import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Role } from '../schema/role.schema';
import { Permission } from '../schema/permission.schema';
import { RolePermission } from '../schema/role-permission.schema';
import { Users } from '../schema/user.schema';
import { Table } from '../schema/table.schema';
import { Order } from '../schema/order.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Role, 
      Permission, 
      RolePermission,
      Users,
      Table,
      Order,
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
