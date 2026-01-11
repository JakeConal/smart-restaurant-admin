import { Module } from '@nestjs/common';
import { WaiterController } from './waiter.controller';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [OrderModule],
  controllers: [WaiterController],
})
export class WaiterModule {}
