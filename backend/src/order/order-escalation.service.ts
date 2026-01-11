import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Order, OrderStatus } from '../schema/order.schema';
import { AdminAuditLog, AdminAuditAction, AdminAuditStatus } from '../schema/admin-audit-log.schema';

@Injectable()
export class OrderEscalationService {
  private readonly logger = new Logger(OrderEscalationService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(AdminAuditLog)
    private readonly auditLogRepository: Repository<AdminAuditLog>,
  ) {}

  /**
   * Cron job that runs every minute to check for orders pending acceptance
   * for more than 5 minutes and escalate them
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async checkForStaleOrders() {
    try {
      // Calculate 5 minutes ago
      const fiveMinutesAgo = new Date();
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

      // Find orders that are:
      // 1. Status = PENDING_ACCEPTANCE
      // 2. Created more than 5 minutes ago
      // 3. Not yet escalated
      const staleOrders = await this.orderRepository.find({
        where: {
          status: OrderStatus.PENDING_ACCEPTANCE,
          isEscalated: false,
          createdAt: LessThan(fiveMinutesAgo),
        },
        relations: ['waiter'],
      });

      if (staleOrders.length === 0) {
        return;
      }

      this.logger.warn(
        `Found ${staleOrders.length} stale order(s) pending acceptance for >5 minutes`,
      );

      // Escalate each order
      for (const order of staleOrders) {
        await this.escalateOrder(order);
      }
    } catch (error) {
      this.logger.error('Failed to check for stale orders', error);
    }
  }

  /**
   * Escalate a single order
   */
  private async escalateOrder(order: Order): Promise<void> {
    try {
      const originalWaiterId = order.waiter_id ?? null;

      // Update order
      order.isEscalated = true;
      order.escalatedAt = new Date();
      await this.orderRepository.save(order);

      // Log escalation to audit log
      await this.auditLogRepository.save({
        userId: null, // System action
        action: AdminAuditAction.ORDER_ESCALATED,
        ipAddress: 'system',
        userAgent: 'OrderEscalationService',
        status: AdminAuditStatus.SUCCESS,
        metadata: JSON.stringify({
          orderId: order.orderId,
          originalWaiterId,
          tableNumber: order.tableNumber,
          minutesSinceCreation: Math.floor(
            (Date.now() - order.createdAt.getTime()) / 60000,
          ),
        }),
      });

      this.logger.log(
        `Escalated order ${order.orderId} (Table: ${order.tableNumber}, Original Waiter: ${originalWaiterId || 'none'})`,
      );
    } catch (error) {
      this.logger.error(`Failed to escalate order ${order.orderId}`, error);
    }
  }

  /**
   * Manually reassign an escalated order to a new waiter (called by manager)
   */
  async reassignOrder(
    orderId: string,
    newWaiterId: string,
    managerId: string,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderId },
      relations: ['waiter'],
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const oldWaiterId = order.waiter_id ?? null;

    // Reassign to new waiter
    order.waiter_id = newWaiterId;
    order.isEscalated = false; // Clear escalation flag
    order.escalatedAt = null;
    const updatedOrder = await this.orderRepository.save(order);

    // Log reassignment
    await this.auditLogRepository.save({
      userId: managerId,
      action: AdminAuditAction.ORDER_REASSIGNED,
      ipAddress: 'manager-action',
      userAgent: 'ManagerController',
      status: AdminAuditStatus.SUCCESS,
      metadata: JSON.stringify({
        orderId: order.orderId,
        oldWaiterId,
        newWaiterId,
        tableNumber: order.tableNumber,
      }),
    });

    this.logger.log(
      `Order ${order.orderId} reassigned from ${oldWaiterId || 'none'} to ${newWaiterId} by manager ${managerId}`,
    );

    return updatedOrder;
  }
}
