import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrderService } from '../order/order.service';
import { TableService } from '../table/table.service';
import { AdminGuard } from '../admin-auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { AcceptOrderDto } from '../dto/accept-order.dto';
import { RejectOrderDto } from '../dto/reject-order.dto';
import { SendToKitchenDto } from '../dto/send-to-kitchen.dto';

@Controller('api/waiter')
@UseGuards(AdminGuard)
export class WaiterController {
  constructor(
    private readonly orderService: OrderService,
    private readonly tableService: TableService,
  ) { }

  /**
   * Get my pending and active orders (in kitchen)
   */
  @Get('orders/pending')
  async getMyPendingOrders(@CurrentUser() user: AuthUser) {
    return await this.orderService.getMyActiveOrders(
      user.userId,
      user.restaurantId,
    );
  }

  /**
   * Get count of my active orders
   */
  @Get('orders/pending/count')
  async getMyPendingOrdersCount(@CurrentUser() user: AuthUser) {
    return await this.orderService.getMyActiveOrdersCount(
      user.userId,
      user.restaurantId,
    );
  }

  /**
   * Mark an order as served/delivered
   */
  @Put('orders/:orderId/serve')
  @HttpCode(HttpStatus.OK)
  async markAsServed(
    @Param('orderId') orderId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return await this.orderService.markAsServed(orderId, user.userId);
  }

  /**
   * Accept an order
   */
  @Put('orders/:orderId/accept')
  @HttpCode(HttpStatus.OK)
  async acceptOrder(
    @Param('orderId') orderId: string,
    @Body() acceptOrderDto: AcceptOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return await this.orderService.acceptOrder(
      orderId,
      user.userId,
      acceptOrderDto.version,
    );
  }

  /**
   * Reject an order
   */
  @Put('orders/:orderId/reject')
  @HttpCode(HttpStatus.OK)
  async rejectOrder(
    @Param('orderId') orderId: string,
    @Body() rejectOrderDto: RejectOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return await this.orderService.rejectOrder(
      orderId,
      user.userId,
      rejectOrderDto.reason,
    );
  }

  /**
   * Send order to kitchen
   */
  @Put('orders/:orderId/send-to-kitchen')
  @HttpCode(HttpStatus.OK)
  async sendToKitchen(
    @Param('orderId') orderId: string,
    @Body() sendToKitchenDto: SendToKitchenDto,
    @CurrentUser() user: AuthUser,
  ) {
    return await this.orderService.sendToKitchen(orderId, user.userId);
  }

  /**
   * Get my assigned tables
   */
  @Get('tables/assigned')
  async getMyAssignedTables(@CurrentUser() user: AuthUser) {
    return await this.tableService.findByWaiterId(
      user.userId,
      user.restaurantId,
    );
  }

  /**
   * Complete payment for an order (Cash/E-wallet)
   */
  @Put('orders/:orderId/mark-paid')
  @HttpCode(HttpStatus.OK)
  async markAsPaid(
    @Param('orderId') orderId: string,
    @Body()
    paymentData: {
      paymentMethod: string;
      discountPercentage?: number;
      discountAmount?: number;
      finalTotal?: number;
    },
    @CurrentUser() user: AuthUser,
  ) {
    // We can add verification that the waiter is assigned to this order if needed
    return await this.orderService.markAsPaidByOrderId(orderId, paymentData);
  }
}
