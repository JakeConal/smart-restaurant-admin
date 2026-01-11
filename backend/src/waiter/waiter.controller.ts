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
  ) {}

  /**
   * Get my pending orders (non-escalated)
   */
  @Get('orders/pending')
  async getMyPendingOrders(@CurrentUser() user: AuthUser) {
    return await this.orderService.getMyPendingOrders(user.userId);
  }

  /**
   * Get count of my pending orders
   */
  @Get('orders/pending/count')
  async getMyPendingOrdersCount(@CurrentUser() user: AuthUser) {
    return await this.orderService.getMyPendingOrdersCount(user.userId);
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
}
