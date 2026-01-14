export interface Admin {
  id: string;
  email: string;
  full_name: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  restaurantId: string;
  role: {
    code: string;
    name: string;
  };
  created_at: string;
  updated_at?: string;
  last_login_at?: string;
}

export interface CreateAdminDto {
  email: string;
  full_name: string;
  password: string;
  restaurantId?: string;
}

export interface UpdateAdminDto {
  email?: string;
  full_name?: string;
}

export interface AdminFilterDto {
  search?: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'ALL';
  restaurantId?: string;
}
