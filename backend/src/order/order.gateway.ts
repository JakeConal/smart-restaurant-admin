import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { Order } from '../schema/order.schema';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/orders',
})
export class OrderGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private orderSubscriptions = new Map<string, Set<string>>(); // orderId -> Set of socketIds

  handleConnection(client: Socket) {
    console.log(`[OrderGateway] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[OrderGateway] Client disconnected: ${client.id}`);

    // Remove client from all subscriptions
    this.orderSubscriptions.forEach((sockets) => {
      sockets.delete(client.id);
    });
  }

  /**
   * Subscribe to order updates
   * Event: subscribe
   * Data: { orderId: string }
   */
  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, data: { orderId: string }): void {
    const { orderId } = data;

    if (!orderId) {
      client.emit('error', { message: 'orderId is required' });
      return;
    }

    // Join room for this order
    const roomName = `order-${orderId}`;
    void client.join(roomName);

    // Track subscription
    if (!this.orderSubscriptions.has(orderId)) {
      this.orderSubscriptions.set(orderId, new Set());
    }
    this.orderSubscriptions.get(orderId)?.add(client.id);

    console.log(`[OrderGateway] Client ${client.id} subscribed to ${roomName}`);

    // Confirm subscription
    client.emit('subscribed', { orderId });
  }

  /**
   * Unsubscribe from order updates
   * Event: unsubscribe
   * Data: { orderId: string }
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, data: { orderId: string }): void {
    const { orderId } = data;

    if (!orderId) return;

    const roomName = `order-${orderId}`;
    void client.leave(roomName);

    // Remove subscription
    const sockets = this.orderSubscriptions.get(orderId);
    if (sockets) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.orderSubscriptions.delete(orderId);
      }
    }

    console.log(
      `[OrderGateway] Client ${client.id} unsubscribed from ${roomName}`,
    );
  }

  /**
   * Emit order status update to all subscribers
   * Called from OrderService when order status changes
   */
  broadcastOrderUpdate(orderId: string, order: Order): void {
    const roomName = `order-${orderId}`;

    console.log(`[OrderGateway] Broadcasting order update for ${orderId}:`, {
      status: order.status,
      subscribers: this.orderSubscriptions.get(orderId)?.size || 0,
    });

    this.server.to(roomName).emit('order:updated', {
      orderId,
      order,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit order accepted event
   */
  broadcastOrderAccepted(orderId: string, order: Order): void {
    const roomName = `order-${orderId}`;

    console.log(`[OrderGateway] Broadcasting order accepted for ${orderId}`);

    this.server.to(roomName).emit('order:accepted', {
      orderId,
      order,
      status: 'accepted',
      progress: 15,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit order rejected event
   */
  broadcastOrderRejected(orderId: string, order: Order, reason: string): void {
    const roomName = `order-${orderId}`;

    console.log(`[OrderGateway] Broadcasting order rejected for ${orderId}`);

    this.server.to(roomName).emit('order:rejected', {
      orderId,
      order,
      reason,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit order status progression
   */
  broadcastStatusProgression(
    orderId: string,
    order: Order,
    previousStatus: string,
    newStatus: string,
  ): void {
    const roomName = `order-${orderId}`;

    const progressMap: Record<string, number> = {
      pending_acceptance: 0,
      accepted: 25,
      received: 33,
      preparing: 66,
      ready: 100,
      completed: 100,
    };

    const progress = progressMap[newStatus] ?? 0;

    console.log(
      `[OrderGateway] Broadcasting status progression for ${orderId}: ${previousStatus} -> ${newStatus} (${progress}%)`,
    );

    this.server.to(roomName).emit('order:progress', {
      orderId,
      previousStatus,
      newStatus,
      progress,
      order,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit new order created event to all connected waiters
   */
  broadcastNewOrder(order: Order): void {
    console.log(`[OrderGateway] Broadcasting new order: ${order.orderId}`);

    // Broadcast to all clients in the waiter namespace
    // This notifies all waiters about the new order
    this.server.emit('order:created', {
      orderId: order.orderId,
      order,
      timestamp: new Date().toISOString(),
    });
  }
}
