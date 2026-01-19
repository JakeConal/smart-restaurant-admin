-- ============================================
-- Smart Restaurant Admin - Initial Schema
-- Version: 001
-- Date: 2026-01-19
-- Description: Creates all tables for the smart restaurant system
-- ============================================

-- Set session variables
SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';

-- ============================================
-- ROLE AND PERMISSION TABLES
-- ============================================

-- Role table
CREATE TABLE IF NOT EXISTS `role` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_role_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permission table
CREATE TABLE IF NOT EXISTS `permission` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT,
  `resource` VARCHAR(100),
  `action` VARCHAR(50),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_permission_resource_action` (`resource`, `action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Role-Permission mapping table
CREATE TABLE IF NOT EXISTS `role_permission` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `role_id` VARCHAR(36) NOT NULL,
  `permission_id` VARCHAR(36) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_role_permission` (`role_id`, `permission_id`),
  CONSTRAINT `fk_role_permission_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_role_permission_permission` FOREIGN KEY (`permission_id`) REFERENCES `permission` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- USER TABLES
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `full_name` VARCHAR(255) NOT NULL,
  `avatar_url` VARCHAR(500),
  `role_id` VARCHAR(36),
  `status` ENUM('ACTIVE', 'SUSPENDED', 'DELETED') DEFAULT 'ACTIVE',
  `last_login_at` TIMESTAMP NULL,
  `isEmailVerified` BOOLEAN DEFAULT FALSE,
  `emailVerifiedAt` TIMESTAMP NULL,
  `restaurantId` VARCHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_email` (`email`),
  INDEX `idx_user_role` (`role_id`),
  INDEX `idx_user_restaurant` (`restaurantId`),
  INDEX `idx_user_status` (`status`),
  CONSTRAINT `fk_user_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User credentials table
CREATE TABLE IF NOT EXISTS `user_credentials` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_credentials_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Refresh token table
CREATE TABLE IF NOT EXISTS `refresh_token` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `token` VARCHAR(500) NOT NULL UNIQUE,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_refresh_token_user` (`user_id`),
  INDEX `idx_refresh_token_expires` (`expires_at`),
  CONSTRAINT `fk_refresh_token_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Email verification token table
CREATE TABLE IF NOT EXISTS `email_verification_token` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `token` VARCHAR(500) NOT NULL UNIQUE,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_email_verification_user` (`user_id`),
  INDEX `idx_email_verification_token` (`token`),
  CONSTRAINT `fk_email_verification_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Password reset token table
CREATE TABLE IF NOT EXISTS `password_reset_token` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `token` VARCHAR(500) NOT NULL UNIQUE,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_password_reset_user` (`user_id`),
  INDEX `idx_password_reset_token` (`token`),
  CONSTRAINT `fk_password_reset_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ADMIN TABLES
-- ============================================

-- Admin email verification token table
CREATE TABLE IF NOT EXISTS `admin_email_verification_token` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `admin_id` VARCHAR(36) NOT NULL,
  `token` VARCHAR(500) NOT NULL UNIQUE,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_admin_email_verification_admin` (`admin_id`),
  INDEX `idx_admin_email_verification_token` (`token`),
  CONSTRAINT `fk_admin_email_verification_user` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin password reset token table
CREATE TABLE IF NOT EXISTS `admin_password_reset_token` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `admin_id` VARCHAR(36) NOT NULL,
  `token` VARCHAR(500) NOT NULL UNIQUE,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_admin_password_reset_admin` (`admin_id`),
  INDEX `idx_admin_password_reset_token` (`token`),
  CONSTRAINT `fk_admin_password_reset_user` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin audit log table
CREATE TABLE IF NOT EXISTS `admin_audit_log` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `admin_id` VARCHAR(36) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `resource` VARCHAR(100),
  `resource_id` VARCHAR(36),
  `details` TEXT,
  `ip_address` VARCHAR(45),
  `user_agent` VARCHAR(500),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_admin` (`admin_id`),
  INDEX `idx_audit_action` (`action`),
  INDEX `idx_audit_resource` (`resource`, `resource_id`),
  INDEX `idx_audit_created` (`created_at`),
  CONSTRAINT `fk_audit_admin` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CUSTOMER TABLES
-- ============================================

-- Customer table
CREATE TABLE IF NOT EXISTS `customer` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20),
  `avatar_url` VARCHAR(500),
  `isEmailVerified` BOOLEAN DEFAULT FALSE,
  `emailVerifiedAt` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_customer_email` (`email`),
  INDEX `idx_customer_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- MENU TABLES
-- ============================================

-- Menu category table
CREATE TABLE IF NOT EXISTS `menu_category` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `restaurantId` VARCHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `displayOrder` INT DEFAULT 0,
  `isActive` BOOLEAN DEFAULT TRUE,
  `imageUrl` VARCHAR(500),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_category_restaurant` (`restaurantId`),
  INDEX `idx_category_active` (`isActive`),
  INDEX `idx_category_display_order` (`displayOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Menu item table
CREATE TABLE IF NOT EXISTS `menu_item` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `restaurantId` VARCHAR(36) NOT NULL,
  `categoryId` VARCHAR(36) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(10, 2) NOT NULL,
  `isAvailable` BOOLEAN DEFAULT TRUE,
  `preparationTime` INT,
  `calories` INT,
  `allergens` TEXT,
  `isVegetarian` BOOLEAN DEFAULT FALSE,
  `isVegan` BOOLEAN DEFAULT FALSE,
  `isGlutenFree` BOOLEAN DEFAULT FALSE,
  `spicyLevel` ENUM('none', 'mild', 'medium', 'hot', 'extra-hot') DEFAULT 'none',
  `displayOrder` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_menu_item_restaurant` (`restaurantId`),
  INDEX `idx_menu_item_category` (`categoryId`),
  INDEX `idx_menu_item_available` (`isAvailable`),
  INDEX `idx_menu_item_display_order` (`displayOrder`),
  CONSTRAINT `fk_menu_item_category` FOREIGN KEY (`categoryId`) REFERENCES `menu_category` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Menu item photo table
CREATE TABLE IF NOT EXISTS `menu_item_photo` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `menuItemId` VARCHAR(36) NOT NULL,
  `photoUrl` VARCHAR(500) NOT NULL,
  `displayOrder` INT DEFAULT 0,
  `isPrimary` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_photo_menu_item` (`menuItemId`),
  INDEX `idx_photo_primary` (`isPrimary`),
  CONSTRAINT `fk_photo_menu_item` FOREIGN KEY (`menuItemId`) REFERENCES `menu_item` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Modifier group table
CREATE TABLE IF NOT EXISTS `modifier_group` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `restaurantId` VARCHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `minSelections` INT DEFAULT 0,
  `maxSelections` INT,
  `isRequired` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_modifier_group_restaurant` (`restaurantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Modifier option table
CREATE TABLE IF NOT EXISTS `modifier_option` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `modifierGroupId` VARCHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `priceAdjustment` DECIMAL(10, 2) DEFAULT 0.00,
  `isAvailable` BOOLEAN DEFAULT TRUE,
  `displayOrder` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_modifier_option_group` (`modifierGroupId`),
  INDEX `idx_modifier_option_available` (`isAvailable`),
  CONSTRAINT `fk_modifier_option_group` FOREIGN KEY (`modifierGroupId`) REFERENCES `modifier_group` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Menu item modifier mapping table
CREATE TABLE IF NOT EXISTS `menu_item_modifier` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `menuItemId` VARCHAR(36) NOT NULL,
  `modifierGroupId` VARCHAR(36) NOT NULL,
  `displayOrder` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_menu_item_modifier` (`menuItemId`, `modifierGroupId`),
  INDEX `idx_menu_item_modifier_item` (`menuItemId`),
  INDEX `idx_menu_item_modifier_group` (`modifierGroupId`),
  CONSTRAINT `fk_menu_item_modifier_item` FOREIGN KEY (`menuItemId`) REFERENCES `menu_item` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_menu_item_modifier_group` FOREIGN KEY (`modifierGroupId`) REFERENCES `modifier_group` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE MANAGEMENT
-- ============================================

-- Table table
CREATE TABLE IF NOT EXISTS `table` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `restaurantId` VARCHAR(36) NOT NULL,
  `table_number` VARCHAR(50) NOT NULL,
  `capacity` INT NOT NULL,
  `location` VARCHAR(100),
  `description` TEXT,
  `status` VARCHAR(20) DEFAULT 'active',
  `qrToken` VARCHAR(500),
  `qrTokenCreatedAt` TIMESTAMP NULL,
  `waiter_id` VARCHAR(36),
  `occupancyStatus` VARCHAR(20) DEFAULT 'available',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_restaurant_table` (`restaurantId`, `table_number`),
  INDEX `idx_table_restaurant` (`restaurantId`),
  INDEX `idx_table_waiter` (`waiter_id`),
  INDEX `idx_table_status` (`status`),
  INDEX `idx_table_occupancy` (`occupancyStatus`),
  CONSTRAINT `fk_table_waiter` FOREIGN KEY (`waiter_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ORDER TABLES
-- ============================================

-- Order table
CREATE TABLE IF NOT EXISTS `order` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `restaurantId` VARCHAR(36) NOT NULL,
  `customerId` VARCHAR(36),
  `tableId` VARCHAR(36),
  `waiterId` VARCHAR(36),
  `orderNumber` VARCHAR(50) NOT NULL,
  `status` VARCHAR(20) DEFAULT 'pending',
  `paymentStatus` VARCHAR(20) DEFAULT 'pending',
  `paymentMethod` VARCHAR(50),
  `subtotal` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `tax` DECIMAL(10, 2) DEFAULT 0.00,
  `discount` DECIMAL(10, 2) DEFAULT 0.00,
  `total` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `items` JSON,
  `specialInstructions` TEXT,
  `estimatedCompletionTime` TIMESTAMP NULL,
  `completedAt` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_order_number` (`restaurantId`, `orderNumber`),
  INDEX `idx_order_restaurant` (`restaurantId`),
  INDEX `idx_order_customer` (`customerId`),
  INDEX `idx_order_table` (`tableId`),
  INDEX `idx_order_waiter` (`waiterId`),
  INDEX `idx_order_status` (`status`),
  INDEX `idx_order_payment_status` (`paymentStatus`),
  INDEX `idx_order_created` (`created_at`),
  CONSTRAINT `fk_order_customer` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_order_table` FOREIGN KEY (`tableId`) REFERENCES `table` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_order_waiter` FOREIGN KEY (`waiterId`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- REVIEW TABLE
-- ============================================

-- Review table
CREATE TABLE IF NOT EXISTS `review` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `restaurantId` VARCHAR(36) NOT NULL,
  `customerId` VARCHAR(36) NOT NULL,
  `orderId` VARCHAR(36),
  `rating` INT NOT NULL,
  `comment` TEXT,
  `foodRating` INT,
  `serviceRating` INT,
  `ambianceRating` INT,
  `isVisible` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_review_restaurant` (`restaurantId`),
  INDEX `idx_review_customer` (`customerId`),
  INDEX `idx_review_order` (`orderId`),
  INDEX `idx_review_rating` (`rating`),
  INDEX `idx_review_visible` (`isVisible`),
  CONSTRAINT `fk_review_customer` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_review_order` FOREIGN KEY (`orderId`) REFERENCES `order` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- RESTORE SETTINGS
-- ============================================

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

-- ============================================
-- VERIFICATION QUERY
-- ============================================

SELECT 'Database schema created successfully!' AS Status;
SELECT COUNT(*) AS TableCount FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE';
