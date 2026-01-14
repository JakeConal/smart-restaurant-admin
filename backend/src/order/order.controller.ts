import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';

@Controller('api/orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async create(@Body() createOrderDto: CreateOrderDto) {
    try {
      console.log('[Order Controller] Creating order with:', {
        orderId: createOrderDto.orderId,
        table_id: createOrderDto.table_id,
        itemCount: createOrderDto.items?.length,
        payload: createOrderDto,
      });
      const order = await this.orderService.create(createOrderDto);
      console.log('[Order Controller] Order created successfully:', {
        id: order.id,
        orderId: order.orderId,
      });
      return {
        success: true,
        data: order,
      };
    } catch (error) {
      console.error('[Order Controller] Error creating order:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      const stack = error instanceof Error ? error.stack : undefined;

      throw new HttpException(
        {
          success: false,
          message: 'Failed to create order',
          error: message,
          details: stack,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('by-orderId/:orderId')
  async findByOrderId(@Param('orderId') orderId: string) {
    try {
      const order = await this.orderService.findByOrderId(orderId);
      return {
        success: true,
        data: order,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Order not found',
          error: error.message,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Put('by-orderId/:orderId')
  async updateByOrderId(
    @Param('orderId') orderId: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    try {
      const order = await this.orderService.updateByOrderId(
        orderId,
        updateOrderDto,
      );
      return {
        success: true,
        data: order,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to update order',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put('by-orderId/:orderId/mark-paid')
  async markAsPaidByOrderId(
    @Param('orderId') orderId: string,
    @Body()
    paymentData: {
      paymentMethod?: string;
      discountPercentage?: number;
      discountAmount?: number;
      finalTotal?: number;
    },
  ) {
    try {
      const order = await this.orderService.markAsPaidByOrderId(
        orderId,
        paymentData,
      );
      return {
        success: true,
        data: order,
        message: 'Order marked as paid',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to mark order as paid',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put('by-orderId/:orderId/request-bill')
  async requestBillByOrderId(@Param('orderId') orderId: string) {
    try {
      const order = await this.orderService.requestBillByOrderId(orderId);
      return {
        success: true,
        data: order,
        message: 'Bill requested',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to request bill',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':id')
  async findById(@Param('id') id: number) {
    try {
      const order = await this.orderService.findById(id);
      return {
        success: true,
        data: order,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Order not found',
          error: error.message,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Get('table/:tableId')
  async findByTableId(@Param('tableId') tableId: string) {
    try {
      const orders = await this.orderService.findByTableId(tableId);
      return {
        success: true,
        data: orders,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch orders',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('customer/:customerId')
  async findByCustomerId(@Param('customerId') customerId: string) {
    try {
      const orders = await this.orderService.findByCustomerId(customerId);
      return {
        success: true,
        data: orders,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch orders',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('history/:customerId')
  async getOrderHistory(@Param('customerId') customerId: string) {
    try {
      const orders = await this.orderService.getOrderHistory(customerId);
      return {
        success: true,
        data: orders,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch order history',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    try {
      const order = await this.orderService.update(id, updateOrderDto);
      return {
        success: true,
        data: order,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to update order',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id/mark-paid')
  async markAsPaid(@Param('id') id: number) {
    try {
      const order = await this.orderService.markAsPaid(id);
      return {
        success: true,
        data: order,
        message: 'Order marked as paid',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to mark order as paid',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id/request-bill')
  async requestBill(@Param('id') id: number) {
    try {
      const order = await this.orderService.requestBill(id);
      return {
        success: true,
        data: order,
        message: 'Bill requested',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to request bill',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: number) {
    try {
      await this.orderService.delete(id);
      return {
        success: true,
        message: 'Order deleted successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to delete order',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  async getAll(
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ) {
    try {
      const orders = await this.orderService.getAllOrders(skip, take);
      return {
        success: true,
        data: orders,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch orders',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('revenue/total')
  async getTotalRevenue() {
    try {
      const revenue = await this.orderService.getTotalRevenue();
      return {
        success: true,
        data: { revenue },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to calculate revenue',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
