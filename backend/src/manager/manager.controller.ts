import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { OrderService } from '../order/order.service';
import { OrderEscalationService } from '../order/order-escalation.service';
import { AdminGuard } from '../admin-auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { ReassignOrderDto } from '../dto/reassign-order.dto';

@Controller('api/manager')
@UseGuards(AdminGuard)
export class ManagerController {
  constructor(
    private readonly orderService: OrderService,
    private readonly escalationService: OrderEscalationService,
  ) {}

  /**
   * Get all escalated orders (manager only)
   */
  @Get('orders/escalated')
  async getEscalatedOrders(@CurrentUser() user: AuthUser) {
    // Check if user is admin/manager
    if (user.role?.toUpperCase() !== 'ADMIN') {
      throw new ForbiddenException('Only managers can access escalated orders');
    }

    return await this.orderService.getEscalatedOrders();
  }

  /**
   * Get count of escalated orders
   */
  @Get('orders/escalated/count')
  async getEscalatedOrdersCount(@CurrentUser() user: AuthUser) {
    // Check if user is admin/manager
    if (user.role?.toUpperCase() !== 'ADMIN') {
      throw new ForbiddenException('Only managers can access escalated orders');
    }

    return await this.orderService.getEscalatedOrdersCount();
  }

  /**
   * Reassign an escalated order to a new waiter
   */
  @Put('orders/:orderId/reassign')
  @HttpCode(HttpStatus.OK)
  async reassignOrder(
    @Param('orderId') orderId: string,
    @Body() reassignDto: ReassignOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    // Check if user is admin/manager
    if (user.role?.toUpperCase() !== 'ADMIN') {
      throw new ForbiddenException('Only managers can reassign orders');
    }

    return await this.escalationService.reassignOrder(
      orderId,
      reassignDto.new_waiter_id,
      user.userId,
    );
  }
}
