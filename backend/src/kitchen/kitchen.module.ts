import { Module, forwardRef } from '@nestjs/common';
import { KitchenController } from './kitchen.controller';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [forwardRef(() => OrderModule)],
  controllers: [KitchenController],
})
export class KitchenModule {}
