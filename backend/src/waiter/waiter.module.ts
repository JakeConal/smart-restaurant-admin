import { Module } from '@nestjs/common';
import { WaiterController } from './waiter.controller';
import { OrderModule } from '../order/order.module';
import { TableModule } from '../table/table.module';

@Module({
  imports: [OrderModule, TableModule],
  controllers: [WaiterController],
})
export class WaiterModule {}
