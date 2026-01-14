export enum OrderStatus {
  PENDING_ACCEPTANCE = "pending_acceptance",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  RECEIVED = "received",
  PREPARING = "preparing",
  READY = "ready",
  SERVED = "served",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export interface OrderItem {
  id: number | string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  price?: number;
  subtotal?: number;
  totalPrice?: number;
  unitPrice?: number;
  prepTimeMinutes?: number;
  specialInstructions?: string;
  modifiers?: OrderItemModifier[];
}

export interface OrderItemModifier {
  id: number | string;
  modifierOptionId: number | string;
  modifierOptionName: string;
  price: number;
}

export interface Order {
  id: number;
  orderId: string;
  restaurantId?: string;
  maxPrepTimeMinutes?: number;
  tableNumber: number | string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  discountPercentage?: number;
  discountAmount?: number;
  finalTotal?: number;
  paymentMethod?: string;
  isPaid?: boolean;
  billRequestedAt?: string | null;
  paidAt?: string | null;
  specialRequests?: string;
  specialInstructions?: string; // Kept for backward compatibility, but use specialRequests
  customer_id?: string;
  waiter_id?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  sentToKitchenAt?: string;
  kitchenReceivedAt?: string;
  kitchenPreparingAt?: string;
  kitchenReadyAt?: string;
  servedAt?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  waiter?: {
    userId: string;
    full_name: string;
    email: string;
  };
}

export interface AcceptOrderDto {
  version: number;
}

export interface RejectOrderDto {
  reason: string;
}

export interface SendToKitchenDto {
  waiter_id: string;
}

export interface ReassignOrderDto {
  new_waiter_id: string;
}
