import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../schema/order.schema';
import { Table } from '../schema/table.schema';
import { MenuItem } from '../schema/menu-item.schema';
import { AdminAuditLog } from '../schema/admin-audit-log.schema';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { OrderGateway } from './order.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Table, MenuItem, AdminAuditLog])],
  providers: [OrderService, OrderGateway],
  controllers: [OrderController],
  exports: [OrderService, OrderGateway],
})
export class OrderModule {}
