// Menu types
export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  displayOrder: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface ModifierOption {
  id: string;
  groupId: string;
  name: string;
  priceAdjustment: number;
  status: string;
  createdAt: string;
}

export interface ModifierGroup {
  id: string;
  restaurantId: string;
  name: string;
  selectionType: "single" | "multiple";
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  displayOrder: number;
  status: string;
  options: ModifierOption[];
}

export type MenuItemStatus = "available" | "unavailable" | "sold_out";

export interface MenuItemPhoto {
  id: string;
  menuItemId: string;
  data: string; // base64 encoded or URL
  mimeType: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  price: number;
  description?: string;
  prepTimeMinutes: number;
  status: MenuItemStatus;
  isChefRecommended: boolean;
  isDeleted: boolean;
  popularityScore: number;
  primaryPhotoUrl?: string;
  photos?: MenuItemPhoto[];
  modifierGroups: ModifierGroup[];
  canOrder: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MenuResponse {
  success: boolean;
  message: string;
  table: {
    id: string;
    tableNumber: string;
    capacity: number;
    location?: string;
  };
  menu: {
    categories: MenuCategory[];
    items: MenuItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// Auth types
export interface Customer {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  profilePicture?: string;
  googleProfilePicUrl?: string;
  googleId?: string;
  isGoogleLogin?: boolean;
}

export interface AuthResponse {
  access_token: string;
  user: Customer;
}

// Cart types
export interface CartItemModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceAdjustment: number;
}

export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  modifiers: CartItemModifier[];
  specialInstructions?: string;
  totalPrice: number;
}

// Order types
export type OrderStatus =
  | "pending_acceptance"
  | "accepted"
  | "rejected"
  | "received"
  | "preparing"
  | "ready"
  | "served"
  | "completed"
  | "cancelled";

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  modifiers: CartItemModifier[];
  specialInstructions?: string;
}

export interface Order {
  id: string;
  orderId?: string; // Custom order ID (order-{timestamp}) - used for WebSocket subscription
  customerId?: string;
  tableId: string;
  tableNumber: string;
  guestName?: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  specialRequests?: string;
  isPaid?: boolean;
  billRequestedAt?: string;
  paidAt?: string;
  sentToKitchenAt?: string;
  kitchenReceivedAt?: string;
  kitchenPreparingAt?: string;
  kitchenReadyAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Review types
export interface Review {
  id: string;
  customerId: string;
  customerName: string;
  menuItemId: string;
  orderId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

// Token payload
export interface TokenPayload {
  tableId: string;
  restaurantId: string;
  timestamp: string;
}
