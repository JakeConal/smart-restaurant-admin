# Smart Restaurant

Smart Restaurant is a full-stack restaurant management platform built as a monorepo. It includes a customer-facing ordering experience, an admin dashboard for restaurant operations, and a NestJS backend that connects everything through REST APIs, real-time updates, authentication, and MySQL persistence.

The project is designed to support the main workflows of a modern restaurant: QR-based table access, digital menu browsing, order placement, kitchen and waiter coordination, payment processing, and operational reporting.

## What This Project Includes

- `customer-frontend`: a Next.js app for guests to browse the menu, place orders, track order status, review items, and pay online.
- `admin-frontend`: a Next.js dashboard for restaurant staff to manage tables, menu data, waiters, kitchen staff, reports, and role-based operations.
- `backend`: a NestJS API with TypeORM, MySQL, JWT auth, Google login support, email flows, Socket.IO updates, and VNPay integration.
- `database`: SQL migration and seed scripts for bootstrapping the MySQL database.

## Key Features

- QR-based table access for dine-in customers
- Customer sign-up, login, email verification, password reset, and Google OAuth
- Digital menu browsing with categories, item details, modifiers, and search
- Cart, order creation, order history, and order tracking
- Real-time order status updates with WebSocket / Socket.IO
- Table management with QR generation and waiter assignment
- Menu, category, modifier group, and photo management
- Waiter and kitchen staff workflows inside the admin system
- Super admin and role/permission-based access control
- Sales and operational reporting
- VNPay sandbox payment flow

## Tech Stack

- Backend: NestJS, TypeScript, TypeORM, MySQL, Socket.IO
- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Auth: JWT, refresh token flow, Google OAuth
- Email: Nodemailer with Gmail SMTP fallback behavior
- Payments: VNPay
- Package management: Yarn workspaces

## Repository Structure

```text
smart-restaurant-admin/
├── admin-frontend/      # Admin dashboard for restaurant staff
├── backend/             # NestJS API and business logic
├── customer-frontend/   # Customer ordering application
├── database/            # SQL migrations and seed data
├── DESIGN_SYSTEM.md     # Shared UI and design notes
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20+
- Yarn 4+
- MySQL 8+

### 1. Install dependencies

```bash
yarn install
```

### 2. Create the database

Follow the SQL setup guide in [`database/README.md`](./database/README.md), or use the quick start below:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS smart_restaurant CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p smart_restaurant < database/migrations/001_initial_schema.sql
mysql -u root -p smart_restaurant < database/seeds/001_initial_data.sql
```

### 3. Configure environment variables

Create `backend/.env` from `backend/.env.example` and add at least:

```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=smart_restaurant
ADMIN_FRONTEND_URL=http://localhost:3000
CUSTOMER_FRONTEND_URL=http://localhost:4000
JWT_SECRET=your_jwt_secret
```

Optional integrations used by the codebase:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CUSTOMER_CALLBACK_URL`
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`
- `VNPAY_TMN_CODE`
- `VNPAY_HASH_SECRET`

For the frontend apps, set:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

The customer frontend also uses:

```env
NEXT_PUBLIC_CUSTOMER_FRONTEND_URL=http://localhost:4000
```

### 4. Run the apps in development

Start the backend:

```bash
yarn workspace backend start:dev
```

Start the admin frontend on port `3000`:

```bash
yarn workspace admin-frontend dev
```

Start the customer frontend on port `4000`:

```bash
yarn workspace customer-frontend dev --port 4000
```

Recommended local URLs:

- Admin dashboard: `http://localhost:3000`
- Backend API: `http://localhost:3001`
- Customer app: `http://localhost:4000`

## Backend Modules

The backend is organized into focused modules for the core restaurant flows:

- authentication for customers and admins
- tables and QR token generation
- menu, categories, items, photos, and modifiers
- orders, kitchen handling, waiter actions, and reports
- profile management, reviews, email, and super admin operations

## Typical User Flow

1. A customer scans a table QR code.
2. The customer is routed into the ordering app with a table token.
3. The customer logs in or continues the flow, browses the menu, and places an order.
4. Staff monitor and process orders from the admin dashboard.
5. Order progress is pushed to the customer in real time.
6. The customer can pay and review their dining experience.

## Notes

- The workspace is configured around Yarn workspaces, so Yarn is the recommended package manager.
- Current sub-project `README` files still contain framework boilerplate. The root `README` is the main project overview.
- Some integrations such as Gmail SMTP, Google OAuth, and VNPay require additional credentials before they are fully usable.

## License

This repository is licensed under the MIT License. See [`LICENSE`](./LICENSE) for details.
