import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order, OrderStatus } from '../schema/order.schema';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const order = this.orderRepository.create({
      ...createOrderDto,
      status: OrderStatus.RECEIVED,
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
}
