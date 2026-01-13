import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order, OrderStatus } from '../schema/order.schema';
import { Table } from '../schema/table.schema';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { OrderGateway } from './order.gateway';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
    private readonly orderGateway: OrderGateway,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    // Get table to find assigned waiter
    let assignedWaiterId: string | null = null;
    if (createOrderDto.table_id) {
      const table = await this.tableRepository.findOne({
        where: { id: createOrderDto.table_id },
      });
      assignedWaiterId = table?.waiter_id || null;
    }

    // Create order with ONLY fields we want, explicitly ignore status from DTO
    const order = this.orderRepository.create({
      orderId: createOrderDto.orderId,
      table_id: createOrderDto.table_id,
      tableNumber: createOrderDto.tableNumber,
      guestName: createOrderDto.guestName,
      items: createOrderDto.items,
      specialRequests: createOrderDto.specialRequests,
      subtotal: createOrderDto.subtotal,
      tax: createOrderDto.tax,
      total: createOrderDto.total,
      customer_id: createOrderDto.customer_id,
      status: OrderStatus.PENDING_ACCEPTANCE, // Always set to PENDING_ACCEPTANCE
      waiter_id: assignedWaiterId,
      isDeleted: false,
      isPaid: createOrderDto.isPaid || false,
      lastItemAddedAt: new Date(), // Track when items were last added
    });

    const savedOrder = await this.orderRepository.save(order);

    // Broadcast new order to all connected waiters
    void this.orderGateway.broadcastNewOrder(savedOrder);

    return savedOrder;
  }

  async findByOrderId(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderId, isDeleted: false },
    });

    if (!order) {
      throw new NotFoundException(`Order with orderId ${orderId} not found`);
    }

    return order;
  }

  async findById(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    return order;
  }

  async findByTableId(tableId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { table_id: tableId, isDeleted: false },
      order: { createdAt: 'DESC' },
    });
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { customer_id: customerId, isDeleted: false, isPaid: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findActiveOrderByTableId(tableId: string): Promise<Order | null> {
    return this.orderRepository.findOne({
      where: {
        table_id: tableId,
        isPaid: false,
        isDeleted: false,
        status: In([
          OrderStatus.RECEIVED,
          OrderStatus.PREPARING,
          OrderStatus.READY,
        ]),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: number, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findById(id);

    Object.assign(order, updateOrderDto);

    return this.orderRepository.save(order);
  }

  async updateByOrderId(
    orderId: string,
    updateOrderDto: UpdateOrderDto,
  ): Promise<Order> {
    const order = await this.findByOrderId(orderId);

    Object.assign(order, updateOrderDto);

    return this.orderRepository.save(order);
  }

  async updateStatus(id: number, status: OrderStatus): Promise<Order> {
    const order = await this.findById(id);
    order.status = status;
    order.updatedAt = new Date();

    return this.orderRepository.save(order);
  }

  async markAsPaid(id: number): Promise<Order> {
    const order = await this.findById(id);
    order.isPaid = true;
    order.paidAt = new Date().toISOString();
    order.updatedAt = new Date();

    return this.orderRepository.save(order);
  }

  async markAsPaidByOrderId(orderId: string): Promise<Order> {
    const order = await this.findByOrderId(orderId);
    order.isPaid = true;
    order.paidAt = new Date().toISOString();
    order.updatedAt = new Date();

    return this.orderRepository.save(order);
  }

  async requestBill(id: number): Promise<Order> {
    const order = await this.findById(id);
    order.billRequestedAt = new Date().toISOString();
    order.updatedAt = new Date();

    return this.orderRepository.save(order);
  }

  async requestBillByOrderId(orderId: string): Promise<Order> {
    const order = await this.findByOrderId(orderId);
    order.billRequestedAt = new Date().toISOString();
    order.updatedAt = new Date();

    return this.orderRepository.save(order);
  }

  async delete(id: number): Promise<void> {
    const order = await this.findById(id);
    order.isDeleted = true;

    await this.orderRepository.save(order);
  }

  async getOrderHistory(customerId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { customer_id: customerId, isPaid: true, isDeleted: false },
      order: { paidAt: 'DESC' },
    });
  }

  async getAllOrders(skip: number = 0, take: number = 10): Promise<Order[]> {
    return this.orderRepository.find({
      where: { isDeleted: false },
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
  }

  async getTotalRevenue(): Promise<number> {
    const result = (await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'total')
      .where('order.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('order.isPaid = :isPaid', { isPaid: true })
      .getRawOne()) as { total: string | null } | undefined;

    return parseFloat(result?.total || '0');
  }

  // ============================================
  // Waiter-specific methods
  // ============================================

  /**
   * Get pending orders for a waiter (PENDING_ACCEPTANCE orders not yet accepted by anyone)
   */
  async getMyPendingOrders(): Promise<Order[]> {
    return this.orderRepository.find({
      where: {
        status: OrderStatus.PENDING_ACCEPTANCE,
        isEscalated: false,
        isDeleted: false,
        waiter_id: null, // Only show orders not yet accepted by anyone
      },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Get count of pending orders for a waiter
   */
  async getMyPendingOrdersCount(): Promise<{
    count: number;
    oldestOrderMinutes: number | null;
  }> {
    const orders = await this.getMyPendingOrders();
    const count = orders.length;

    let oldestOrderMinutes: number | null = null;
    if (orders.length > 0) {
      const oldestOrder = orders[0]; // Already sorted by createdAt ASC
      // Handle both Date objects and numeric timestamps
      const createdTime =
        oldestOrder.createdAt instanceof Date
          ? oldestOrder.createdAt.getTime()
          : new Date(oldestOrder.createdAt).getTime();
      oldestOrderMinutes = Math.floor((Date.now() - createdTime) / 60000);
    }

    return { count, oldestOrderMinutes };
  }

  /**
   * Get all escalated orders (for manager)
   */
  async getEscalatedOrders(): Promise<Order[]> {
    return this.orderRepository.find({
      where: {
        isEscalated: true,
        status: OrderStatus.PENDING_ACCEPTANCE,
        isDeleted: false,
      },
      relations: ['waiter'],
      order: { escalatedAt: 'ASC' },
    });
  }

  /**
   * Get count of escalated orders
   */
  async getEscalatedOrdersCount(): Promise<{ count: number }> {
    const count = await this.orderRepository.count({
      where: {
        isEscalated: true,
        status: OrderStatus.PENDING_ACCEPTANCE,
        isDeleted: false,
      },
    });

    return { count };
  }

  /**
   * Accept order (with optimistic locking) - just claim the order, don't change status
   */
  async acceptOrder(
    orderId: string,
    waiterId: string,
    version: number,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderId, isDeleted: false },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PENDING_ACCEPTANCE) {
      throw new ConflictException('Order is not pending acceptance');
    }

    // Check version for optimistic locking
    if (order.version !== version) {
      throw new ConflictException(
        'Order has been modified by another user. Please refresh and try again.',
      );
    }

    // Accept order: just assign to waiter, don't change status
    order.waiter_id = waiterId;
    order.acceptedAt = new Date();

    try {
      const updatedOrder = await this.orderRepository.save(order);

      // Emit WebSocket event
      this.orderGateway.broadcastOrderAccepted(orderId, updatedOrder);

      return updatedOrder;
    } catch {
      // TypeORM will throw OptimisticLockVersionMismatchError
      throw new ConflictException(
        'Order has been modified by another user. Please refresh and try again.',
      );
    }
  } /**
   * Reject order
   */
  async rejectOrder(
    orderId: string,
    waiterId: string,
    reason: string,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderId, isDeleted: false },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PENDING_ACCEPTANCE) {
      throw new ConflictException('Order is not pending acceptance');
    }

    order.status = OrderStatus.REJECTED;
    order.waiter_id = waiterId;
    order.rejectedAt = new Date();
    order.rejectionReason = reason;

    const updatedOrder = await this.orderRepository.save(order);

    // Emit WebSocket event
    this.orderGateway.broadcastOrderRejected(orderId, updatedOrder, reason);

    return updatedOrder;
  }

  /**
   * Send order to kitchen
   */
  async sendToKitchen(orderId: string, waiterId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderId, isDeleted: false },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PENDING_ACCEPTANCE) {
      throw new ConflictException(
        'Order must be in pending acceptance status before sending to kitchen',
      );
    }

    if (order.waiter_id !== waiterId) {
      throw new ConflictException('You are not assigned to this order');
    }

    const previousStatus = order.status;
    // Transition: PENDING_ACCEPTANCE -> ACCEPTED (and mark as sent to kitchen)
    order.status = OrderStatus.ACCEPTED;
    order.sentToKitchenAt = new Date();

    const updatedOrder = await this.orderRepository.save(order);

    // Emit WebSocket event for status progression
    this.orderGateway.broadcastStatusProgression(
      orderId,
      updatedOrder,
      previousStatus,
      updatedOrder.status,
    );

    return updatedOrder;
  }
}
