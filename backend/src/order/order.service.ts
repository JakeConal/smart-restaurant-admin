import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order, OrderStatus } from '../schema/order.schema';
import { Table } from '../schema/table.schema';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
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

    const order = this.orderRepository.create({
      ...createOrderDto,
      status: OrderStatus.PENDING_ACCEPTANCE,
      waiter_id: assignedWaiterId,
      isDeleted: false,
    });

    return this.orderRepository.save(order);
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
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'total')
      .where('order.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('order.isPaid = :isPaid', { isPaid: true })
      .getRawOne();

    return parseFloat(result?.total || 0);
  }

  // ============================================
  // Waiter-specific methods
  // ============================================

  /**
   * Get pending orders for a specific waiter (non-escalated)
   */
  async getMyPendingOrders(waiterId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: {
        waiter_id: waiterId,
        status: OrderStatus.PENDING_ACCEPTANCE,
        isEscalated: false,
        isDeleted: false,
      },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Get count of pending orders for a waiter
   */
  async getMyPendingOrdersCount(waiterId: string): Promise<{
    count: number;
    oldestOrderMinutes: number | null;
  }> {
    const orders = await this.getMyPendingOrders(waiterId);
    const count = orders.length;
    
    let oldestOrderMinutes: number | null = null;
    if (orders.length > 0) {
      const oldestOrder = orders[0]; // Already sorted by createdAt ASC
      oldestOrderMinutes = Math.floor(
        (Date.now() - oldestOrder.createdAt.getTime()) / 60000,
      );
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
   * Accept order (with optimistic locking)
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

    order.status = OrderStatus.ACCEPTED;
    order.waiter_id = waiterId;
    order.acceptedAt = new Date();

    try {
      return await this.orderRepository.save(order);
    } catch (error) {
      // TypeORM will throw OptimisticLockVersionMismatchError
      throw new ConflictException(
        'Order has been modified by another user. Please refresh and try again.',
      );
    }
  }

  /**
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

    return this.orderRepository.save(order);
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

    if (order.status !== OrderStatus.ACCEPTED) {
      throw new ConflictException('Order must be accepted before sending to kitchen');
    }

    if (order.waiter_id !== waiterId) {
      throw new ConflictException('You are not assigned to this order');
    }

    order.status = OrderStatus.PREPARING;
    order.sentToKitchenAt = new Date();

    return this.orderRepository.save(order);
  }
}

