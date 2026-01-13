export interface KitchenStaff {
  id: string;
  email: string;
  full_name: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  role: {
    code: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateKitchenStaffDto {
  email: string;
  full_name: string;
  password: string;
}

export interface UpdateKitchenStaffDto {
  email?: string;
  full_name?: string;
  password?: string;
}
