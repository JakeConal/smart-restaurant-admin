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
    throw new Error(
      errorDetails.error ||
        errorDetails.message ||
        `HTTP error! status: ${response.status}`,
    );
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
  }) =>
    apiRequest("/auth/customer/signup", {
      method: "POST",
      body: JSON.stringify(data),
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
  getMenu: (
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

    return apiRequest(`/api/menu?${queryParams.toString()}`);
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

  markAsPaid: (orderId: string) =>
    apiRequest(`/api/orders/by-orderId/${orderId}/mark-paid`, {
      method: "PUT",
    }),

  requestBill: (orderId: string) =>
    apiRequest(`/api/orders/by-orderId/${orderId}/request-bill`, {
      method: "PUT",
    }),

  getOrderHistory: (customerId: number) =>
    apiRequest(`/api/orders/history/${customerId}`, {
      method: "GET",
    }),

  getOrdersByTable: (tableId: number) =>
    apiRequest(`/api/orders/table/${tableId}`, {
      method: "GET",
    }),
};
