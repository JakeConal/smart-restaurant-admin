export interface Waiter {
  id?: string;
  userId?: string;
  full_name: string;
  email: string;
}

export interface Table {
  id: string;
  tableNumber: string;
  capacity: number;
  location?: string;
  description?: string;
  status: "active" | "inactive";
  qrToken?: string;
  qrTokenCreatedAt?: string;
  waiter_id?: string;
  waiter?: Waiter;
  occupancyStatus?: "available" | "occupied" | "reserved";
  createdAt: string;
  updatedAt: string;
}

export interface CreateTableDto {
  tableNumber: string;
  capacity: number;
  location?: string;
  description?: string;
  status?: "active" | "inactive";
  waiter_id?: string;
}

export interface UpdateTableDto {
  tableNumber?: string;
  capacity?: number;
  location?: string;
  description?: string;
  status?: "active" | "inactive";
  waiter_id?: string;
}

export interface TableFilters {
  status?: "active" | "inactive";
  location?: string;
  sortBy?: "tableNumber" | "capacity" | "createdAt";
}

export interface QRCodeData {
  url: string;
  token: string;
}

export interface TableStats {
  total: number;
  active: number;
  inactive: number;
  qrValidPercentage: number;
}
