# Database Setup

This folder contains the database migration scripts for the Smart Restaurant Admin system.

## Prerequisites

- MySQL 8.0 or higher
- MySQL Client installed
- Database user with CREATE, ALTER, INSERT privileges

## Quick Start

### 1. Create Database

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS smart_restaurant CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 2. Import Migration Script

```bash
mysql -u root -p smart_restaurant < migrations/001_initial_schema.sql
```

### 3. Import Seed Data (Optional)

```bash
mysql -u root -p smart_restaurant < seeds/001_initial_data.sql
```

### 4. Verify Installation

```bash
mysql -u root -p smart_restaurant < migrations/verify_migration.sql
```

## Using MySQL Workbench

1. Open MySQL Workbench and connect to your MySQL server
2. Click **File** → **Run SQL Script**
3. Navigate to `database/migrations/001_initial_schema.sql`
4. Select the `smart_restaurant` database
5. Click **Run**
6. Repeat for seed data if needed

## Configure Backend

Update your backend `.env` file:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=smart_restaurant
```

## Folder Structure

```
database/
├── README.md                    # This file
├── migrations/                  # Database schema migrations
│   ├── 001_initial_schema.sql  # Creates all tables and indexes
│   └── verify_migration.sql    # Verification script
└── seeds/                       # Initial data
    └── 001_initial_data.sql    # Sample data for development
```

## Troubleshooting

### Cannot connect to MySQL

```bash
# Check MySQL status
sudo systemctl status mysql

# Start MySQL if not running
sudo systemctl start mysql
```

### Permission denied

```bash
# Grant privileges to your user
mysql -u root -p -e "GRANT ALL PRIVILEGES ON smart_restaurant.* TO 'your_user'@'localhost'; FLUSH PRIVILEGES;"
```

### Database already exists

```bash
# Drop and recreate the database
mysql -u root -p -e "DROP DATABASE IF EXISTS smart_restaurant;"
# Then repeat step 1 above
```
