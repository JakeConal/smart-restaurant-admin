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
  id: number;
  menuItemId: number;
  menuItemName: string;
  quantity: number;
  price?: number;
  subtotal?: number;
  totalPrice?: number;
  unitPrice?: number;
  specialInstructions?: string;
  modifiers?: OrderItemModifier[];
}

export interface OrderItemModifier {
  id: number;
  modifierOptionId: number;
  modifierOptionName: string;
  price: number;
}

export interface Order {
  id: number;
  orderId: string;
  tableNumber: number;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  specialInstructions?: string;
  customer_id?: string;
  waiter_id?: string;
  isEscalated: boolean;
  escalatedAt?: string;
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
