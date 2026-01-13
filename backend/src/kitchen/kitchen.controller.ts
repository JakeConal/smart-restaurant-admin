import {
  Controller,
  Get,
  Put,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { OrderService } from '../order/order.service';
import { AdminGuard } from '../admin-auth/guards/admin.guard';

@Controller('api/kitchen')
@UseGuards(AdminGuard)
export class KitchenController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * Get all orders for kitchen (RECEIVED, PREPARING, READY statuses)
   */
  @Get('orders')
  async getKitchenOrders() {
    try {
      const orders = await this.orderService.getKitchenOrders();
      return {
        success: true,
        data: orders,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch kitchen orders',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Move order to RECEIVED status
   */
  @Put('orders/:orderId/received')
  @HttpCode(HttpStatus.OK)
  async moveToReceived(@Param('orderId') orderId: string) {
    try {
      const order = await this.orderService.updateKitchenStatus(
        orderId,
        'received',
      );
      return {
        success: true,
        data: order,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to update order status',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Move order to PREPARING status
   */
  @Put('orders/:orderId/preparing')
  @HttpCode(HttpStatus.OK)
  async moveToPreparing(@Param('orderId') orderId: string) {
    try {
      const order = await this.orderService.updateKitchenStatus(
        orderId,
        'preparing',
      );
      return {
        success: true,
        data: order,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to update order status',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Move order to READY status
   */
  @Put('orders/:orderId/ready')
  @HttpCode(HttpStatus.OK)
  async moveToReady(@Param('orderId') orderId: string) {
    try {
      const order = await this.orderService.updateKitchenStatus(
        orderId,
        'ready',
      );
      return {
        success: true,
        data: order,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to update order status',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
