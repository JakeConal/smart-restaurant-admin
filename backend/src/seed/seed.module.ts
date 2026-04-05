import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Role } from '../users/entities/role.schema';
import { Permission } from '../users/entities/permission.schema';
import { RolePermission } from '../users/entities/role-permission.schema';
import { Users } from '../users/entities/user.schema';
import { UserCredentials } from '../users/entities/user-credentials.schema';
import { Table } from '../table/entities/table.entity';
import { Order } from '../order/entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Role,
      Permission,
      RolePermission,
      Users,
      UserCredentials,
      Table,
      Order,
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}

