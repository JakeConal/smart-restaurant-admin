import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../order/entities/order.entity';
import { Table } from '../table/entities/table.entity';
import { MenuItem } from '../menu/entities/menu-item.entity';
import { AdminAuditLog } from '../admin-auth/entities/admin-audit-log.schema';
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

