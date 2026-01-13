export interface Waiter {
  id: string;
  email: string;
  full_name: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  role: {
    code: string;
    name: string;
  };
  assignedTablesCount: number;
  created_at: string;
  updated_at: string;
}

export interface CreateWaiterDto {
  email: string;
  full_name: string;
  password: string;
}

export interface UpdateWaiterDto {
  email?: string;
  full_name?: string;
  password?: string;
}
