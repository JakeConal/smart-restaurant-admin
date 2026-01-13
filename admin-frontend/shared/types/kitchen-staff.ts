export interface KitchenStaff {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
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
  avatar_url?: string;
}

export interface UpdateKitchenStaffDto {
  email?: string;
  full_name?: string;
  password?: string;
  avatar_url?: string;
}
