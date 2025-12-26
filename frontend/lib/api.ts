import axios from 'axios';
import type { Table, CreateTableDto, UpdateTableDto, TableFilters, QRCodeData } from '@/types/table';
import type { GuestMenuResponse, MenuFilters } from '@/types/menu';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include JWT token in all requests
apiClient.interceptors.request.use(
  (config) => {
    // Only add token for admin API routes
    if (config.url?.includes('/api/admin/')) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        // Redirect to login page if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API Operations
export interface LoginDto {
  email: string;
  password: string;
}

export interface SignupDto {
  email: string;
  password: string;
  name: string;
  restaurantId: string;
  role?: string;
}

export interface AuthResponse {
  access_token: string;
}

export const authApi = {
  // Login
  login: async (credentials: LoginDto): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', credentials);
    // Store token in localStorage
    if (response.data.access_token && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', response.data.access_token);
    }
    return response.data;
  },

  // Signup
  signup: async (data: SignupDto): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/signup', data);
    return response.data;
  },

  // Logout
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('auth_token');
  },

  // Get stored token
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  },
};

// Table CRUD Operations
export const tableApi = {
  // Get all tables with optional filters
  getAll: async (filters?: TableFilters): Promise<Table[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.location) params.append('location', filters.location);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);

    const response = await apiClient.get(`/api/admin/tables?${params.toString()}`);
    return response.data;
  },

  // Get single table by ID
  getById: async (id: string): Promise<Table> => {
    const response = await apiClient.get(`/api/admin/tables/${id}`);
    return response.data;
  },

  // Create new table
  create: async (data: CreateTableDto): Promise<Table> => {
    const response = await apiClient.post('/api/admin/tables', data);
    return response.data;
  },

  // Update table
  update: async (id: string, data: UpdateTableDto): Promise<Table> => {
    const response = await apiClient.put(`/api/admin/tables/${id}`, data);
    return response.data;
  },

  // Update table status
  updateStatus: async (id: string, status: 'active' | 'inactive'): Promise<Table> => {
    const response = await apiClient.patch(`/api/admin/tables/${id}/status`, { status });
    return response.data;
  },

  // Delete table
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/admin/tables/${id}`);
  },
};

// QR Code Operations
export const qrApi = {
  // Generate/Regenerate QR code for a table
  generate: async (tableId: string): Promise<QRCodeData> => {
    const response = await apiClient.post(`/api/admin/tables/${tableId}/qr/generate`);
    return response.data;
  },

  // Regenerate QR code
  regenerate: async (tableId: string): Promise<QRCodeData> => {
    const response = await apiClient.post(`/api/admin/tables/${tableId}/qr/regenerate`);
    return response.data;
  },

  // Bulk regenerate all active tables
  regenerateAll: async (): Promise<{ count: number; tables: Table[] }> => {
    const response = await apiClient.post('/api/admin/tables/qr/regenerate-all');
    return response.data;
  },

  // Download QR code as PNG
  downloadPNG: async (tableId: string): Promise<Blob> => {
    const response = await apiClient.get(`/api/admin/tables/${tableId}/qr/download?format=png`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Download QR code as PDF
  downloadPDF: async (tableId: string): Promise<Blob> => {
    const response = await apiClient.get(`/api/admin/tables/${tableId}/qr/download?format=pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Download all QR codes as ZIP
  downloadAllZIP: async (): Promise<Blob> => {
    const response = await apiClient.get('/api/admin/tables/qr/download-all?format=zip', {
      responseType: 'blob',
    });
    return response.data;
  },

  // Download all QR codes as PDF
  downloadAllPDF: async (): Promise<Blob> => {
    const response = await apiClient.get('/api/admin/tables/qr/download-all?format=pdf', {
      responseType: 'blob',
    });
    return response.data;
  },
};

// Guest Menu Operations
export const menuApi = {
  // Get guest menu (accessed via QR code)
  getGuestMenu: async (
    tableId: string,
    token: string,
    filters?: MenuFilters
  ): Promise<GuestMenuResponse> => {
    const params = new URLSearchParams();
    params.append('table', tableId);
    params.append('token', token);
    
    if (filters?.q) params.append('q', filters.q);
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.sort) params.append('sort', filters.sort);
    if (filters?.chefRecommended !== undefined) {
      params.append('chefRecommended', String(filters.chefRecommended));
    }
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const response = await apiClient.get(`/api/menu?${params.toString()}`);
    return response.data;
  },
};

// Helper function to download blob as file
export const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
