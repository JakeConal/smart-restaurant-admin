// Re-export core utilities
export { apiClient, downloadFile } from "./client";

// Import APIs for re-export
import { TablesApi, tablesApi } from "./tables";
import { MenuApi, menuApi } from "./menu";
import { AuthApi, authApi } from "./auth";
import type { LoginRequest, SignupRequest, AuthResponse } from "./auth";

// Export route-based APIs
export { TablesApi, tablesApi, MenuApi, menuApi, AuthApi, authApi };
export type { LoginRequest, SignupRequest, AuthResponse };
