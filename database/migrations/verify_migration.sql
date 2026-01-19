-- ============================================
-- Database Verification Script
-- ============================================

USE smart_restaurant;

-- Check all tables exist
SELECT 'Checking tables...' AS Status;

SELECT
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS `Size (MB)`,
    table_rows AS `Rows`
FROM information_schema.TABLES
WHERE table_schema = DATABASE()
ORDER BY table_name;

-- Count records in each table
SELECT 'Record counts...' AS Status;

SELECT
    'role' AS table_name,
    COUNT(*) AS record_count
FROM role
UNION ALL
SELECT 'permission', COUNT(*) FROM permission
UNION ALL
SELECT 'role_permission', COUNT(*) FROM role_permission
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'user_credentials', COUNT(*) FROM user_credentials
UNION ALL
SELECT 'customer', COUNT(*) FROM customer
UNION ALL
SELECT 'menu_category', COUNT(*) FROM menu_category
UNION ALL
SELECT 'menu_item', COUNT(*) FROM menu_item
UNION ALL
SELECT 'modifier_group', COUNT(*) FROM modifier_group
UNION ALL
SELECT 'modifier_option', COUNT(*) FROM modifier_option
UNION ALL
SELECT 'table', COUNT(*) FROM `table`
UNION ALL
SELECT 'order', COUNT(*) FROM `order`
UNION ALL
SELECT 'review', COUNT(*) FROM review;

-- Check foreign key constraints
SELECT 'Checking foreign key constraints...' AS Status;

SELECT
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE
    TABLE_SCHEMA = DATABASE()
    AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, COLUMN_NAME;

-- Sample data verification
SELECT 'Sample user data...' AS Status;

SELECT
    u.email,
    u.full_name,
    r.name AS role,
    u.status,
    u.isEmailVerified
FROM users u
LEFT JOIN role r ON u.role_id = r.id;

SELECT 'Sample menu categories...' AS Status;

SELECT
    name,
    description,
    displayOrder,
    isActive
FROM menu_category
ORDER BY displayOrder;

SELECT 'Sample menu items...' AS Status;

SELECT
    mi.name,
    mc.name AS category,
    mi.price,
    mi.isAvailable
FROM menu_item mi
JOIN menu_category mc ON mi.categoryId = mc.id
ORDER BY mc.displayOrder, mi.displayOrder;

SELECT 'Verification complete!' AS Status;
