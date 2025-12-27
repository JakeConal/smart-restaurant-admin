export interface Table {
  id: string;
  tableNumber: string;
  capacity: number;
  location?: string;
  description?: string;
  status: 'active' | 'inactive';
  qrToken?: string;
  qrTokenCreatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTableDto {
  tableNumber: string;
  capacity: number;
  location?: string;
  description?: string;
  status?: 'active' | 'inactive';
}

export interface UpdateTableDto {
  tableNumber?: string;
  capacity?: number;
  location?: string;
  description?: string;
  status?: 'active' | 'inactive';
}

export interface TableFilters {
  status?: 'active' | 'inactive';
  location?: string;
  sortBy?: 'tableNumber' | 'capacity' | 'createdAt';
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
