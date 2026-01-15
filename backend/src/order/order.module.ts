import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../schema/order.schema';
import { Table } from '../schema/table.schema';
import { MenuItem } from '../schema/menu-item.schema';
import { AdminAuditLog } from '../schema/admin-audit-log.schema';
import { OrderService } from './order.service';
import { VNPayService } from './vnpay.service';
import { OrderController } from './order.controller';
import { VNPayController } from './vnpay.controller';
import { OrderGateway } from './order.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Table, MenuItem, AdminAuditLog])],
  providers: [OrderService, VNPayService, OrderGateway],
  controllers: [OrderController, VNPayController],
  exports: [OrderService, VNPayService, OrderGateway],
})
export class OrderModule { }
