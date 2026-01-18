import { MenuResponse, MenuItem } from "./types";
import { getMenuFromCache, setMenuInCache } from "./menu-cache";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Helper function to make API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };

  // Log the request for debugging
  console.log(`🌐 API Request: ${options.method || "GET"} ${url}`);
  if (options.body) {
    console.log(`📦 Request body:`, JSON.parse(options.body as string));
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    // Default caching for GET requests in Next.js
    ...(options.method === "GET" || !options.method
      ? { next: { revalidate: 300 } } // Cache for 5 minutes
      : {}),
  });

  if (!response.ok) {
    let errorDetails;
    const responseText = await response.text();
    try {
      errorDetails = JSON.parse(responseText);
    } catch {
      errorDetails = { message: responseText || "Request failed" };
    }

    console.error(`❌ API Error [${response.status}] ${url}:`, errorDetails);
    console.error(`📄 Response text:`, responseText);

    // Handle NestJS error format
    let errorMessage =
      errorDetails.error ||
      errorDetails.message ||
      `HTTP error! status: ${response.status}`;

    const messageLower =
      errorDetails.message?.toLowerCase() ||
      errorDetails.error?.toLowerCase() ||
      "";

    // For authentication/login errors - "Invalid credentials" error
    if (
      response.status === 400 &&
      messageLower.includes("invalid credentials")
    ) {
      errorMessage =
        "Invalid email or password. Please check your credentials.";
    }
    // For password change errors
    else if (
      response.status === 401 &&
      messageLower.includes("current password")
    ) {
      errorMessage = "Current password is incorrect";
    } else if (
      response.status === 400 &&
      messageLower.includes("password does not meet")
    ) {
      errorMessage = "New password does not meet complexity requirements";
    } else if (
      response.status === 400 &&
      messageLower.includes("cannot change password for google")
    ) {
      errorMessage = "Cannot change password for Google login accounts";
    } else if (
      response.status === 400 &&
      messageLower.includes("account does not have a password")
    ) {
      errorMessage =
        "Account does not have a password. Please use forgot password to set one.";
    } else if (
      response.status === 400 &&
      messageLower.includes("new password must be different")
    ) {
      errorMessage = "New password must be different from current password";
    }
    // For signup errors
    else if (
      response.status === 400 &&
      messageLower.includes("email already exists")
    ) {
      errorMessage =
        "An account with this email already exists. Please try logging in instead.";
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

// Auth API
export const authApi = {
  customerLogin: (email: string, password: string) =>
    apiRequest("/auth/customer/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  customerSignup: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    tableToken?: string;
  }) =>
    apiRequest("/auth/customer/signup", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  verifyEmail: (token: string) =>
    apiRequest("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  resendVerificationEmail: (email: string) =>
    apiRequest("/auth/resend-verification-email", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  forgotPassword: (email: string, tableToken?: string) =>
    apiRequest("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email, tableToken }),
    }),

  resetPassword: (token: string, password: string) =>
    apiRequest("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    }),

  getGoogleAuthUrl: (params: { token?: string; redirect?: string }) => {
    const queryParams = new URLSearchParams(
      params as Record<string, string>,
    ).toString();
    return `${API_BASE_URL}/auth/customer/google?${queryParams}`;
  },
};

// Menu API
export const menuApi = {
  getMenu: async (
    token: string,
    params?: {
      q?: string;
      categoryId?: string;
      sort?: string;
      chefRecommended?: boolean;
      page?: number;
      limit?: number;
    },
  ) => {
    // Try to get from cache first
    const cacheParams = {
      token,
      q: params?.q,
      categoryId: params?.categoryId,
      sort: params?.sort,
      chefRecommended: params?.chefRecommended,
      page: params?.page,
    };

    const cachedData = getMenuFromCache(cacheParams);
    if (cachedData) {
      return cachedData;
    }

    const queryParams = new URLSearchParams();
    queryParams.set("token", token);
    if (params?.q) queryParams.set("q", params.q);
    if (params?.categoryId) queryParams.set("categoryId", params.categoryId);
    if (params?.sort) queryParams.set("sort", params.sort);
    if (params?.chefRecommended !== undefined) {
      queryParams.set("chefRecommended", String(params.chefRecommended));
    }
    if (params?.page) queryParams.set("page", String(params.page));
    if (params?.limit) queryParams.set("limit", String(params.limit));

    const response = await apiRequest<MenuResponse>(
      `/api/menu?${queryParams.toString()}`,
    );

    // Save to cache if successful
    if (response.success) {
      setMenuInCache(cacheParams, response);
    }

    return response;
  },

  getMenuItem: async (id: string, token: string) => {
    return apiRequest<MenuItem>(`/api/menu/items/${id}?token=${token}`);
  },

  getPhotoUrl: (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    if (url.startsWith("data:")) return url;
    return `${API_BASE_URL}${url}`;
  },

  getItemPhoto: (photoId: string) =>
    `${API_BASE_URL}/api/menu-item-photo/${photoId}`,
};

// Customer profile API
export const profileApi = {
  getProfile: (authToken: string) =>
    apiRequest("/profile", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }),

  updateProfile: (
    authToken: string,
    data: {
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
      dateOfBirth?: string;
    },
  ) =>
    apiRequest("/profile", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(data),
    }),

  updatePassword: (
    authToken: string,
    data: {
      currentPassword: string;
      newPassword: string;
    },
  ) =>
    apiRequest("/profile/password", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(data),
    }),

  uploadPhoto: async (authToken: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/profile/picture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Upload failed" }));
      throw new Error(error.message);
    }

    return response.json();
  },
};

// Reviews API
export const reviewApi = {
  getItemReviews: (
    menuItemId: string,
    restaurantId: string,
    params?: {
      page?: number;
      limit?: number;
    },
  ) => {
    const queryParams = new URLSearchParams();
    queryParams.set("restaurantId", restaurantId);
    if (params?.page) queryParams.set("page", String(params.page));
    if (params?.limit) queryParams.set("limit", String(params.limit));

    return apiRequest(
      `/api/reviews/item/${menuItemId}?${queryParams.toString()}`,
    );
  },

  getAverageRating: (menuItemId: string, restaurantId: string) => {
    const queryParams = new URLSearchParams();
    queryParams.set("restaurantId", restaurantId);

    return apiRequest(
      `/api/reviews/item/${menuItemId}/rating?${queryParams.toString()}`,
    );
  },

  createReview: (
    authToken: string,
    data: {
      menuItemId: string;
      rating: number;
      comment?: string;
      orderId?: string;
    },
  ) =>
    apiRequest("/api/reviews", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(data),
    }),

  deleteReview: (reviewId: string, authToken: string) =>
    apiRequest(`/api/reviews/${reviewId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }),

  updateReview: (
    reviewId: string,
    authToken: string,
    data: {
      rating?: number;
      comment?: string;
    },
  ) =>
    apiRequest(`/api/reviews/${reviewId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(data),
    }),
};
// Order API
export const orderApi = {
  createOrder: (data: any) =>
    apiRequest("/api/orders", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getOrderByOrderId: (orderId: string) =>
    apiRequest(`/api/orders/by-orderId/${orderId}`, {
      method: "GET",
    }),

  getOrderById: (id: number) =>
    apiRequest(`/api/orders/${id}`, {
      method: "GET",
    }),

  updateOrder: (id: number, data: any) =>
    apiRequest(`/api/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  updateOrderByOrderId: (orderId: string, data: any) =>
    apiRequest(`/api/orders/by-orderId/${orderId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  markAsPaid: (orderId: string, paymentData: any) =>
    apiRequest(`/api/orders/by-orderId/${orderId}/mark-paid`, {
      method: "PUT",
      body: JSON.stringify(paymentData),
    }),

  requestBill: (orderId: string) =>
    apiRequest(`/api/orders/by-orderId/${orderId}/request-bill`, {
      method: "PUT",
    }),

  getOrderHistory: (customerId: string, authToken?: string) =>
    apiRequest(`/api/orders/history/${customerId}`, {
      method: "GET",
      headers: authToken
        ? {
            Authorization: `Bearer ${authToken}`,
          }
        : {},
    }),

  getOrdersByTable: (tableId: string) =>
    apiRequest(`/api/orders/table/${tableId}`, {
      method: "GET",
    }),

  getOrdersByCustomer: (customerId: string, authToken?: string) =>
    apiRequest(`/api/orders/customer/${customerId}`, {
      method: "GET",
      headers: authToken
        ? {
            Authorization: `Bearer ${authToken}`,
          }
        : {},
    }),
};

// VNPay API
export const vnpayApi = {
  createPayment: (data: {
    orderIds: string[];
    totalAmount: number;
    returnUrl: string;
  }) =>
    apiRequest<{ success: boolean; paymentUrl: string }>(
      "/api/vnpay/create-payment",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    ),

  verifyReturn: (queryParams: string) =>
    apiRequest<{
      success: boolean;
      message: string;
      orderIds?: string[];
    }>(`/api/vnpay/vnpay-return?${queryParams}`, {
      method: "GET",
    }),
};
