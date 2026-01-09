import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../schema/order.schema';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Order])],
  providers: [OrderService],
  controllers: [OrderController],
  exports: [OrderService],
})
export class OrderModule {}
