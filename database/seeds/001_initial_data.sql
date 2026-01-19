-- ============================================
-- Smart Restaurant Admin - Initial Seed Data
-- Version: 001
-- Date: 2026-01-19
-- Description: Inserts initial roles, permissions, and sample data
-- ============================================

-- Note: UUIDs are generated as simple identifiers. In production, use proper UUID v4.

-- ============================================
-- ROLES
-- ============================================

INSERT INTO `role` (`id`, `name`, `description`) VALUES
('role-super-admin-001', 'SUPER_ADMIN', 'Super administrator with full system access'),
('role-restaurant-admin-001', 'RESTAURANT_ADMIN', 'Restaurant administrator'),
('role-manager-001', 'MANAGER', 'Restaurant manager'),
('role-waiter-001', 'WAITER', 'Waiter/Server'),
('role-kitchen-staff-001', 'KITCHEN_STAFF', 'Kitchen staff member'),
('role-customer-001', 'CUSTOMER', 'Customer role');

-- ============================================
-- PERMISSIONS
-- ============================================

-- User Management Permissions
INSERT INTO `permission` (`id`, `name`, `description`, `resource`, `action`) VALUES
('perm-user-create-001', 'user:create', 'Create users', 'user', 'create'),
('perm-user-read-001', 'user:read', 'View users', 'user', 'read'),
('perm-user-update-001', 'user:update', 'Update users', 'user', 'update'),
('perm-user-delete-001', 'user:delete', 'Delete users', 'user', 'delete');

-- Menu Management Permissions
INSERT INTO `permission` (`id`, `name`, `description`, `resource`, `action`) VALUES
('perm-menu-create-001', 'menu:create', 'Create menu items', 'menu', 'create'),
('perm-menu-read-001', 'menu:read', 'View menu items', 'menu', 'read'),
('perm-menu-update-001', 'menu:update', 'Update menu items', 'menu', 'update'),
('perm-menu-delete-001', 'menu:delete', 'Delete menu items', 'menu', 'delete');

-- Order Management Permissions
INSERT INTO `permission` (`id`, `name`, `description`, `resource`, `action`) VALUES
('perm-order-create-001', 'order:create', 'Create orders', 'order', 'create'),
('perm-order-read-001', 'order:read', 'View orders', 'order', 'read'),
('perm-order-update-001', 'order:update', 'Update orders', 'order', 'update'),
('perm-order-delete-001', 'order:delete', 'Delete orders', 'order', 'delete');

-- Table Management Permissions
INSERT INTO `permission` (`id`, `name`, `description`, `resource`, `action`) VALUES
('perm-table-create-001', 'table:create', 'Create tables', 'table', 'create'),
('perm-table-read-001', 'table:read', 'View tables', 'table', 'read'),
('perm-table-update-001', 'table:update', 'Update tables', 'table', 'update'),
('perm-table-delete-001', 'table:delete', 'Delete tables', 'table', 'delete');

-- Reports Permissions
INSERT INTO `permission` (`id`, `name`, `description`, `resource`, `action`) VALUES
('perm-reports-read-001', 'reports:read', 'View reports', 'reports', 'read'),
('perm-reports-export-001', 'reports:export', 'Export reports', 'reports', 'export');

-- Kitchen Permissions
INSERT INTO `permission` (`id`, `name`, `description`, `resource`, `action`) VALUES
('perm-kitchen-read-001', 'kitchen:read', 'View kitchen orders', 'kitchen', 'read'),
('perm-kitchen-update-001', 'kitchen:update', 'Update kitchen orders', 'kitchen', 'update');

-- ============================================
-- ROLE-PERMISSION MAPPINGS
-- ============================================

-- Super Admin - All Permissions
INSERT INTO `role_permission` (`id`, `role_id`, `permission_id`) VALUES
('rp-super-admin-001', 'role-super-admin-001', 'perm-user-create-001'),
('rp-super-admin-002', 'role-super-admin-001', 'perm-user-read-001'),
('rp-super-admin-003', 'role-super-admin-001', 'perm-user-update-001'),
('rp-super-admin-004', 'role-super-admin-001', 'perm-user-delete-001'),
('rp-super-admin-005', 'role-super-admin-001', 'perm-menu-create-001'),
('rp-super-admin-006', 'role-super-admin-001', 'perm-menu-read-001'),
('rp-super-admin-007', 'role-super-admin-001', 'perm-menu-update-001'),
('rp-super-admin-008', 'role-super-admin-001', 'perm-menu-delete-001'),
('rp-super-admin-009', 'role-super-admin-001', 'perm-order-create-001'),
('rp-super-admin-010', 'role-super-admin-001', 'perm-order-read-001'),
('rp-super-admin-011', 'role-super-admin-001', 'perm-order-update-001'),
('rp-super-admin-012', 'role-super-admin-001', 'perm-order-delete-001'),
('rp-super-admin-013', 'role-super-admin-001', 'perm-table-create-001'),
('rp-super-admin-014', 'role-super-admin-001', 'perm-table-read-001'),
('rp-super-admin-015', 'role-super-admin-001', 'perm-table-update-001'),
('rp-super-admin-016', 'role-super-admin-001', 'perm-table-delete-001'),
('rp-super-admin-017', 'role-super-admin-001', 'perm-reports-read-001'),
('rp-super-admin-018', 'role-super-admin-001', 'perm-reports-export-001'),
('rp-super-admin-019', 'role-super-admin-001', 'perm-kitchen-read-001'),
('rp-super-admin-020', 'role-super-admin-001', 'perm-kitchen-update-001');

-- Restaurant Admin - Most Permissions
INSERT INTO `role_permission` (`id`, `role_id`, `permission_id`) VALUES
('rp-rest-admin-001', 'role-restaurant-admin-001', 'perm-user-create-001'),
('rp-rest-admin-002', 'role-restaurant-admin-001', 'perm-user-read-001'),
('rp-rest-admin-003', 'role-restaurant-admin-001', 'perm-user-update-001'),
('rp-rest-admin-004', 'role-restaurant-admin-001', 'perm-menu-create-001'),
('rp-rest-admin-005', 'role-restaurant-admin-001', 'perm-menu-read-001'),
('rp-rest-admin-006', 'role-restaurant-admin-001', 'perm-menu-update-001'),
('rp-rest-admin-007', 'role-restaurant-admin-001', 'perm-menu-delete-001'),
('rp-rest-admin-008', 'role-restaurant-admin-001', 'perm-order-read-001'),
('rp-rest-admin-009', 'role-restaurant-admin-001', 'perm-order-update-001'),
('rp-rest-admin-010', 'role-restaurant-admin-001', 'perm-table-create-001'),
('rp-rest-admin-011', 'role-restaurant-admin-001', 'perm-table-read-001'),
('rp-rest-admin-012', 'role-restaurant-admin-001', 'perm-table-update-001'),
('rp-rest-admin-013', 'role-restaurant-admin-001', 'perm-table-delete-001'),
('rp-rest-admin-014', 'role-restaurant-admin-001', 'perm-reports-read-001'),
('rp-rest-admin-015', 'role-restaurant-admin-001', 'perm-reports-export-001'),
('rp-rest-admin-016', 'role-restaurant-admin-001', 'perm-kitchen-read-001');

-- Manager Permissions
INSERT INTO `role_permission` (`id`, `role_id`, `permission_id`) VALUES
('rp-manager-001', 'role-manager-001', 'perm-user-read-001'),
('rp-manager-002', 'role-manager-001', 'perm-menu-read-001'),
('rp-manager-003', 'role-manager-001', 'perm-menu-update-001'),
('rp-manager-004', 'role-manager-001', 'perm-order-read-001'),
('rp-manager-005', 'role-manager-001', 'perm-order-update-001'),
('rp-manager-006', 'role-manager-001', 'perm-table-read-001'),
('rp-manager-007', 'role-manager-001', 'perm-table-update-001'),
('rp-manager-008', 'role-manager-001', 'perm-reports-read-001'),
('rp-manager-009', 'role-manager-001', 'perm-kitchen-read-001');

-- Waiter Permissions
INSERT INTO `role_permission` (`id`, `role_id`, `permission_id`) VALUES
('rp-waiter-001', 'role-waiter-001', 'perm-menu-read-001'),
('rp-waiter-002', 'role-waiter-001', 'perm-order-create-001'),
('rp-waiter-003', 'role-waiter-001', 'perm-order-read-001'),
('rp-waiter-004', 'role-waiter-001', 'perm-order-update-001'),
('rp-waiter-005', 'role-waiter-001', 'perm-table-read-001'),
('rp-waiter-006', 'role-waiter-001', 'perm-table-update-001');

-- Kitchen Staff Permissions
INSERT INTO `role_permission` (`id`, `role_id`, `permission_id`) VALUES
('rp-kitchen-001', 'role-kitchen-staff-001', 'perm-menu-read-001'),
('rp-kitchen-002', 'role-kitchen-staff-001', 'perm-kitchen-read-001'),
('rp-kitchen-003', 'role-kitchen-staff-001', 'perm-kitchen-update-001');

-- Customer Permissions
INSERT INTO `role_permission` (`id`, `role_id`, `permission_id`) VALUES
('rp-customer-001', 'role-customer-001', 'perm-menu-read-001'),
('rp-customer-002', 'role-customer-001', 'perm-order-create-001'),
('rp-customer-003', 'role-customer-001', 'perm-order-read-001');

-- ============================================
-- SAMPLE USERS
-- ============================================
-- Note: Password is 'Password123!' (hashed with bcrypt)
-- Hash: $2b$10$YourBcryptHashHere (replace with actual hash in production)

-- Sample Super Admin
INSERT INTO `users` (`id`, `email`, `full_name`, `role_id`, `status`, `isEmailVerified`, `restaurantId`) VALUES
('user-super-admin-001', 'superadmin@restaurant.com', 'Super Administrator', 'role-super-admin-001', 'ACTIVE', TRUE, NULL);

INSERT INTO `user_credentials` (`id`, `user_id`, `password_hash`) VALUES
('cred-super-admin-001', 'user-super-admin-001', '$2b$10$rQZ8kJhGXZ8kJhGXZ8kJhOu9vKwZqWzXyVuTsRqPnMlKjIhGfEdCy');

-- Sample Restaurant Admin
INSERT INTO `users` (`id`, `email`, `full_name`, `role_id`, `status`, `isEmailVerified`, `restaurantId`) VALUES
('user-restaurant-admin-001', 'admin@restaurant.com', 'Restaurant Admin', 'role-restaurant-admin-001', 'ACTIVE', TRUE, 'restaurant-001');

INSERT INTO `user_credentials` (`id`, `user_id`, `password_hash`) VALUES
('cred-restaurant-admin-001', 'user-restaurant-admin-001', '$2b$10$rQZ8kJhGXZ8kJhGXZ8kJhOu9vKwZqWzXyVuTsRqPnMlKjIhGfEdCy');

-- Sample Manager
INSERT INTO `users` (`id`, `email`, `full_name`, `role_id`, `status`, `isEmailVerified`, `restaurantId`) VALUES
('user-manager-001', 'manager@restaurant.com', 'Restaurant Manager', 'role-manager-001', 'ACTIVE', TRUE, 'restaurant-001');

INSERT INTO `user_credentials` (`id`, `user_id`, `password_hash`) VALUES
('cred-manager-001', 'user-manager-001', '$2b$10$rQZ8kJhGXZ8kJhGXZ8kJhOu9vKwZqWzXyVuTsRqPnMlKjIhGfEdCy');

-- Sample Waiter
INSERT INTO `users` (`id`, `email`, `full_name`, `role_id`, `status`, `isEmailVerified`, `restaurantId`) VALUES
('user-waiter-001', 'waiter1@restaurant.com', 'John Waiter', 'role-waiter-001', 'ACTIVE', TRUE, 'restaurant-001');

INSERT INTO `user_credentials` (`id`, `user_id`, `password_hash`) VALUES
('cred-waiter-001', 'user-waiter-001', '$2b$10$rQZ8kJhGXZ8kJhGXZ8kJhOu9vKwZqWzXyVuTsRqPnMlKjIhGfEdCy');

-- Sample Kitchen Staff
INSERT INTO `users` (`id`, `email`, `full_name`, `role_id`, `status`, `isEmailVerified`, `restaurantId`) VALUES
('user-kitchen-001', 'kitchen1@restaurant.com', 'Chef Mike', 'role-kitchen-staff-001', 'ACTIVE', TRUE, 'restaurant-001');

INSERT INTO `user_credentials` (`id`, `user_id`, `password_hash`) VALUES
('cred-kitchen-001', 'user-kitchen-001', '$2b$10$rQZ8kJhGXZ8kJhGXZ8kJhOu9vKwZqWzXyVuTsRqPnMlKjIhGfEdCy');

-- ============================================
-- SAMPLE CUSTOMERS
-- ============================================

INSERT INTO `customer` (`id`, `email`, `password_hash`, `full_name`, `phone`, `isEmailVerified`) VALUES
('customer-001', 'customer1@email.com', '$2b$10$rQZ8kJhGXZ8kJhGXZ8kJhOu9vKwZqWzXyVuTsRqPnMlKjIhGfEdCy', 'Jane Customer', '+1234567890', TRUE),
('customer-002', 'customer2@email.com', '$2b$10$rQZ8kJhGXZ8kJhGXZ8kJhOu9vKwZqWzXyVuTsRqPnMlKjIhGfEdCy', 'Bob Customer', '+1234567891', TRUE);

-- ============================================
-- SAMPLE MENU CATEGORIES
-- ============================================

INSERT INTO `menu_category` (`id`, `restaurantId`, `name`, `description`, `displayOrder`, `isActive`) VALUES
('category-001', 'restaurant-001', 'Appetizers', 'Start your meal with our delicious appetizers', 1, TRUE),
('category-002', 'restaurant-001', 'Main Courses', 'Hearty and satisfying main dishes', 2, TRUE),
('category-003', 'restaurant-001', 'Desserts', 'Sweet treats to end your meal', 3, TRUE),
('category-004', 'restaurant-001', 'Beverages', 'Refreshing drinks', 4, TRUE);

-- ============================================
-- SAMPLE MENU ITEMS
-- ============================================

INSERT INTO `menu_item` (`id`, `restaurantId`, `categoryId`, `name`, `description`, `price`, `isAvailable`, `preparationTime`, `calories`, `isVegetarian`, `isVegan`, `displayOrder`) VALUES
('item-001', 'restaurant-001', 'category-001', 'Spring Rolls', 'Crispy vegetable spring rolls with sweet chili sauce', 8.99, TRUE, 10, 250, TRUE, TRUE, 1),
('item-002', 'restaurant-001', 'category-001', 'Chicken Wings', 'Spicy buffalo wings with blue cheese dip', 12.99, TRUE, 15, 450, FALSE, FALSE, 2),
('item-003', 'restaurant-001', 'category-002', 'Grilled Salmon', 'Fresh Atlantic salmon with lemon butter sauce', 24.99, TRUE, 20, 550, FALSE, FALSE, 1),
('item-004', 'restaurant-001', 'category-002', 'Vegetable Pasta', 'Penne pasta with seasonal vegetables', 16.99, TRUE, 15, 480, TRUE, FALSE, 2),
('item-005', 'restaurant-001', 'category-003', 'Chocolate Cake', 'Rich chocolate cake with vanilla ice cream', 9.99, TRUE, 5, 650, TRUE, FALSE, 1),
('item-006', 'restaurant-001', 'category-004', 'Lemonade', 'Freshly squeezed lemonade', 4.99, TRUE, 3, 120, TRUE, TRUE, 1);

-- ============================================
-- SAMPLE MODIFIER GROUPS
-- ============================================

INSERT INTO `modifier_group` (`id`, `restaurantId`, `name`, `description`, `minSelections`, `maxSelections`, `isRequired`) VALUES
('modgroup-001', 'restaurant-001', 'Cooking Temperature', 'How would you like your meat cooked?', 1, 1, TRUE),
('modgroup-002', 'restaurant-001', 'Extra Toppings', 'Add extra toppings', 0, 5, FALSE),
('modgroup-003', 'restaurant-001', 'Side Dishes', 'Choose your side', 1, 1, TRUE);

-- ============================================
-- SAMPLE MODIFIER OPTIONS
-- ============================================

INSERT INTO `modifier_option` (`id`, `modifierGroupId`, `name`, `priceAdjustment`, `isAvailable`, `displayOrder`) VALUES
('modopt-001', 'modgroup-001', 'Rare', 0.00, TRUE, 1),
('modopt-002', 'modgroup-001', 'Medium Rare', 0.00, TRUE, 2),
('modopt-003', 'modgroup-001', 'Medium', 0.00, TRUE, 3),
('modopt-004', 'modgroup-001', 'Well Done', 0.00, TRUE, 4),
('modopt-005', 'modgroup-002', 'Extra Cheese', 2.00, TRUE, 1),
('modopt-006', 'modgroup-002', 'Bacon', 3.00, TRUE, 2),
('modopt-007', 'modgroup-002', 'Avocado', 2.50, TRUE, 3),
('modopt-008', 'modgroup-003', 'French Fries', 0.00, TRUE, 1),
('modopt-009', 'modgroup-003', 'Salad', 0.00, TRUE, 2),
('modopt-010', 'modgroup-003', 'Rice', 0.00, TRUE, 3);

-- ============================================
-- SAMPLE TABLES
-- ============================================

INSERT INTO `table` (`id`, `restaurantId`, `table_number`, `capacity`, `location`, `status`, `occupancyStatus`) VALUES
('table-001', 'restaurant-001', 'T1', 2, 'Window Section', 'active', 'available'),
('table-002', 'restaurant-001', 'T2', 4, 'Main Hall', 'active', 'available'),
('table-003', 'restaurant-001', 'T3', 4, 'Main Hall', 'active', 'available'),
('table-004', 'restaurant-001', 'T4', 6, 'Private Section', 'active', 'available'),
('table-005', 'restaurant-001', 'T5', 8, 'Banquet Hall', 'active', 'available');

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

SELECT 'Sample data inserted successfully!' AS Status;
SELECT
    (SELECT COUNT(*) FROM role) AS Roles,
    (SELECT COUNT(*) FROM permission) AS Permissions,
    (SELECT COUNT(*) FROM users) AS Users,
    (SELECT COUNT(*) FROM customer) AS Customers,
    (SELECT COUNT(*) FROM menu_category) AS Categories,
    (SELECT COUNT(*) FROM menu_item) AS MenuItems,
    (SELECT COUNT(*) FROM `table`) AS Tables;
