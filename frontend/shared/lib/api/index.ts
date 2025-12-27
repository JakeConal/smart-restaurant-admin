// Re-export core utilities
export { apiClient, downloadFile } from "./client";

// Import APIs for re-export
import { TablesApi, tablesApi } from "./tables";
import { MenuApi, menuApi } from "./menu";

// Export route-based APIs
export { TablesApi, tablesApi, MenuApi, menuApi };
