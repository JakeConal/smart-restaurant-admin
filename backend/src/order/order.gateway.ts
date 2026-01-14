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
   * Join restaurant room for receiving broadcasts
   * Event: join-restaurant
   * Data: { restaurantId: string }
   */
  @SubscribeMessage('join-restaurant')
  handleJoinRestaurant(client: Socket, data: { restaurantId: string }): void {
    const { restaurantId } = data;

    if (!restaurantId) {
      console.warn(
        `[OrderGateway] Client ${client.id} tried to join restaurant without restaurantId`,
      );
      client.emit('error', { message: 'restaurantId is required' });
      return;
    }

    const restaurantRoomName = `restaurant-${restaurantId}`;
    void client.join(restaurantRoomName);
    console.log(
      `[OrderGateway] ✅ Client ${client.id} joined restaurant room: ${restaurantRoomName}`,
    );

    // Confirm join
    client.emit('joined-restaurant', { restaurantId });
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
    const rooms = [`order-${orderId}`];
    if (order.restaurantId) {
      rooms.push(`restaurant-${order.restaurantId}`);
    }

    console.log(`[OrderGateway] Broadcasting order update for ${orderId}:`, {
      status: order.status,
      subscribers: this.orderSubscriptions.get(orderId)?.size || 0,
      restaurantId: order.restaurantId,
    });

    this.server.to(rooms).emit('order:updated', {
      orderId,
      order,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit order accepted event
   */
  broadcastOrderAccepted(orderId: string, order: Order): void {
    const rooms = [`order-${orderId}`];
    if (order.restaurantId) {
      rooms.push(`restaurant-${order.restaurantId}`);
    }

    console.log(`[OrderGateway] Broadcasting order accepted for ${orderId}`);

    this.server.to(rooms).emit('order:accepted', {
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
    const rooms = [`order-${orderId}`];
    if (order.restaurantId) {
      rooms.push(`restaurant-${order.restaurantId}`);
    }

    console.log(`[OrderGateway] Broadcasting order rejected for ${orderId}`);

    this.server.to(rooms).emit('order:rejected', {
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
    const restaurantRoomName = `restaurant-${order.restaurantId}`;

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

    // Broadcast to both rooms (order-specific and restaurant-wide)
    // Using an array of rooms ensures clients in both only get one emission
    const targetRooms = [roomName];
    if (order.restaurantId) {
      targetRooms.push(restaurantRoomName);
    }

    this.server.to(targetRooms).emit('order:progress', {
      orderId,
      previousStatus,
      newStatus,
      progress,
      order,
      timestamp: new Date().toISOString(),
    });

    // If order just moved to RECEIVED status, notify kitchen in this restaurant only
    if (newStatus === 'received' && order.restaurantId) {
      this.server.to(restaurantRoomName).emit('kitchen:neworder', {
        orderId,
        order,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Emit new order created event to waiters in specific restaurant
   */
  broadcastNewOrder(order: Order): void {
    console.log(`[OrderGateway] Broadcasting new order: ${order.orderId}`);
    console.log(`[OrderGateway] Order details:`, {
      orderId: order.orderId,
      restaurantId: order.restaurantId,
      tableId: order.table_id,
      tableNumber: order.tableNumber,
    });

    // Only broadcast to clients in this restaurant's room
    if (order.restaurantId) {
      const restaurantRoomName = `restaurant-${order.restaurantId}`;
      console.log(`[OrderGateway] Broadcasting to room: ${restaurantRoomName}`);
      this.server.to(restaurantRoomName).emit('order:created', {
        orderId: order.orderId,
        order,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.warn(
        `[OrderGateway] ⚠️  Order ${order.orderId} has NO restaurantId - broadcast SKIPPED!`,
      );
    }
  }
}
