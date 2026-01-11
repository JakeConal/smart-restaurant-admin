import { Module } from '@nestjs/common';
import { ManagerController } from './manager.controller';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [OrderModule],
  controllers: [ManagerController],
})
export class ManagerModule {}
