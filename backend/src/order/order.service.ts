import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order, OrderStatus } from '../schema/order.schema';
import { Table } from '../schema/table.schema';
import { MenuItem } from '../schema/menu-item.schema';
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
    @InjectRepository(MenuItem)
    private readonly menuItemRepository: Repository<MenuItem>,
    private readonly orderGateway: OrderGateway,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    // Get table to find assigned waiter and restaurantId
    let assignedWaiterId: string | null = null;
    let restaurantId: string | null = null;
    if (createOrderDto.table_id) {
      const table = await this.tableRepository.findOne({
        where: { id: createOrderDto.table_id },
      });
      assignedWaiterId = table?.waiter_id || null;
      restaurantId = table?.restaurantId || null;

      console.log(
        `[OrderService] Found table: ${JSON.stringify({
          tableId: createOrderDto.table_id,
          restaurantId,
          tableNumber: table?.tableNumber,
        })}`,
      );
    } else {
      console.log(`[OrderService] No table_id provided in order creation`);
    }

    // Enrich items with prep time and calculate max prep time
    let maxPrepTimeMinutes = 0;
    const enrichedItems = await Promise.all(
      createOrderDto.items.map(async (item) => {
        const menuItem = await this.menuItemRepository.findOne({
          where: { id: item.menuItemId },
        });
        const prepTime = menuItem?.prepTimeMinutes || 0;
        if (prepTime > maxPrepTimeMinutes) {
          maxPrepTimeMinutes = prepTime;
        }
        return {
          ...item,
          prepTimeMinutes: prepTime,
        };
      }),
    );

    // Create order with ONLY fields we want, explicitly ignore status from DTO
    const order = this.orderRepository.create({
      orderId: createOrderDto.orderId,
      table_id: createOrderDto.table_id,
      restaurantId, // Store restaurant ID for socket filtering
      maxPrepTimeMinutes, // Store max prep time for kitchen highlighting
      tableNumber: createOrderDto.tableNumber,
      guestName: createOrderDto.guestName,
      items: enrichedItems,
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

    console.log(
      `[OrderService] Order saved: ${JSON.stringify({
        orderId: savedOrder.orderId,
        restaurantId: savedOrder.restaurantId,
        status: savedOrder.status,
      })}`,
    );

    // Broadcast new order to all connected waiters (with restaurant filtering)
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

    // Auto apply 10% discount if total > 100
    if (Number(order.total) > 100) {
      order.discountPercentage = 10;
      order.discountAmount = Number(order.total) * 0.1;
      order.finalTotal = Number(order.total) - order.discountAmount;
    } else {
      order.discountPercentage = 0;
      order.discountAmount = 0;
      order.finalTotal = Number(order.total);
    }

    return this.orderRepository.save(order);
  }

  async markAsPaidByOrderId(
    orderId: string,
    paymentData?: {
      paymentMethod?: string;
      discountPercentage?: number;
      discountAmount?: number;
      finalTotal?: number;
    },
  ): Promise<Order> {
    const order = await this.findByOrderId(orderId);
    order.isPaid = true;
    order.paidAt = new Date().toISOString();
    order.updatedAt = new Date();

    // Enforce 10% discount if order total > 100 or if paymentData specifies it
    // (Supporting aggregate discounts from the frontend)
    const hasDiscountInPaymentData =
      paymentData &&
      (paymentData.discountPercentage || paymentData.discountAmount);

    if (hasDiscountInPaymentData) {
      order.discountPercentage = paymentData.discountPercentage || 0;
      order.discountAmount = paymentData.discountAmount || 0;
      order.finalTotal =
        paymentData.finalTotal || Number(order.total) - order.discountAmount;
    } else if (Number(order.total) > 100) {
      order.discountPercentage = 10;
      order.discountAmount = Number(order.total) * 0.1;
      order.finalTotal = Number(order.total) - order.discountAmount;
    } else {
      order.discountPercentage = 0;
      order.discountAmount = 0;
      order.finalTotal = Number(order.total);
    }

    if (paymentData && paymentData.paymentMethod) {
      order.paymentMethod = paymentData.paymentMethod;
    }

    const savedOrder = await this.orderRepository.save(order);

    // Notify staff through WebSocket
    this.orderGateway.broadcastOrderUpdate(orderId, savedOrder);

    return savedOrder;
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

    const savedOrder = await this.orderRepository.save(order);

    // Notify staff through WebSocket
    this.orderGateway.broadcastOrderUpdate(orderId, savedOrder);

    return savedOrder;
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
   * Get active orders for a waiter (PENDING_ACCEPTANCE orders not yet accepted, OR orders accepted by this waiter that are in kitchen)
   */
  async getMyActiveOrders(
    waiterId: string,
    restaurantId: string,
  ): Promise<Order[]> {
    return this.orderRepository.find({
      where: [
        {
          status: OrderStatus.PENDING_ACCEPTANCE,
          isDeleted: false,
          waiter_id: null, // Only show orders not yet accepted by anyone
          restaurantId: restaurantId,
        },
        {
          status: In([
            OrderStatus.RECEIVED,
            OrderStatus.PREPARING,
            OrderStatus.READY,
          ]),
          isDeleted: false,
          waiter_id: waiterId, // Orders specifically assigned to this waiter
          restaurantId: restaurantId,
        },
      ],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Get pending orders for a waiter (legacy method, currently kept for compatibility)
   */
  async getMyPendingOrders(restaurantId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: {
        status: OrderStatus.PENDING_ACCEPTANCE,
        isDeleted: false,
        waiter_id: null,
        restaurantId: restaurantId,
      },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Get count of active orders for a waiter
   */
  async getMyActiveOrdersCount(
    waiterId: string,
    restaurantId: string,
  ): Promise<{
    count: number;
    oldestOrderMinutes: number | null;
  }> {
    const orders = await this.getMyActiveOrders(waiterId, restaurantId);
    const count = orders.length;

    let oldestOrderMinutes: number | null = null;
    if (orders.length > 0) {
      const oldestOrder = orders[0];
      const createdTime =
        oldestOrder.createdAt instanceof Date
          ? oldestOrder.createdAt.getTime()
          : new Date(oldestOrder.createdAt).getTime();
      oldestOrderMinutes = Math.floor((Date.now() - createdTime) / 60000);
    }

    return { count, oldestOrderMinutes };
  }

  /**
   * Get count of pending orders for a waiter
   */
  async getMyPendingOrdersCount(restaurantId: string): Promise<{
    count: number;
    oldestOrderMinutes: number | null;
  }> {
    const orders = await this.getMyPendingOrders(restaurantId);
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
   * Mark an order as served (delivered to table)
   */
  async markAsServed(orderId: string, waiterId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderId, isDeleted: false },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.READY) {
      throw new ConflictException('Order must be in ready status to be served');
    }

    if (order.waiter_id !== waiterId) {
      throw new ConflictException('You are not assigned to this order');
    }

    const previousStatus = order.status;
    order.status = OrderStatus.SERVED;
    order.updatedAt = new Date();

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

  /**
   * Accept order and send to kitchen - directly move to RECEIVED status
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

    const previousStatus = order.status;

    // Accept order: assign to waiter AND send directly to kitchen
    order.waiter_id = waiterId;
    order.acceptedAt = new Date();
    order.status = OrderStatus.RECEIVED; // Send directly to kitchen
    order.sentToKitchenAt = new Date();
    order.kitchenReceivedAt = new Date();

    try {
      const updatedOrder = await this.orderRepository.save(order);

      // Emit WebSocket event for status progression
      this.orderGateway.broadcastStatusProgression(
        orderId,
        updatedOrder,
        previousStatus,
        updatedOrder.status,
      );

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
    // Transition: PENDING_ACCEPTANCE -> RECEIVED (sent directly to kitchen)
    order.status = OrderStatus.RECEIVED;
    order.sentToKitchenAt = new Date();
    order.kitchenReceivedAt = new Date();

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

  // ============================================
  // Kitchen-specific methods
  // ============================================

  /**
   * Get all orders for kitchen display (RECEIVED, PREPARING, READY statuses)
   */
  async getKitchenOrders(restaurantId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: {
        status: In([
          OrderStatus.RECEIVED,
          OrderStatus.PREPARING,
          OrderStatus.READY,
        ]),
        isDeleted: false,
        restaurantId: restaurantId,
      },
      order: { sentToKitchenAt: 'ASC' },
    });
  }

  /**
   * Update kitchen status (move between columns)
   */
  async updateKitchenStatus(
    orderId: string,
    newStatus: 'received' | 'preparing' | 'ready',
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderId, isDeleted: false },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const previousStatus = order.status;
    const statusMap: Record<string, OrderStatus> = {
      received: OrderStatus.RECEIVED,
      preparing: OrderStatus.PREPARING,
      ready: OrderStatus.READY,
    };

    order.status = statusMap[newStatus];
    order.updatedAt = new Date();

    // Track timestamps for each status
    if (newStatus === 'received' && !order.kitchenReceivedAt) {
      order.kitchenReceivedAt = new Date();
    } else if (newStatus === 'preparing' && !order.kitchenPreparingAt) {
      order.kitchenPreparingAt = new Date();
    } else if (newStatus === 'ready' && !order.kitchenReadyAt) {
      order.kitchenReadyAt = new Date();
    }

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
