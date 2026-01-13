import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../schema/order.schema';
import { Table } from '../schema/table.schema';
import { AdminAuditLog } from '../schema/admin-audit-log.schema';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { OrderEscalationService } from './order-escalation.service';
import { OrderGateway } from './order.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Table, AdminAuditLog])],
  providers: [OrderService, OrderEscalationService, OrderGateway],
  controllers: [OrderController],
  exports: [OrderService, OrderEscalationService, OrderGateway],
})
export class OrderModule {}
