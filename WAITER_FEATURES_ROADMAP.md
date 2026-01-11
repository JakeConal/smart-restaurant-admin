# Waiter Features & Bill Management - Implementation Roadmap

## Overview
This document outlines the implementation phases for waiter role features and bill management system in the smart restaurant application.

## Timeline Estimate
- **Total Story Points**: 4.0
- **Estimated Duration**: 2-3 sprints (depending on team size and velocity)

---

## Phase 1: Foundation & Database Schema (0.5 SP)

### 1.1 Database Schema Updates
**Priority**: Critical - Must be done first

#### Current Schema Analysis:
- ✅ **Order** schema exists (`backend/src/schema/order.schema.ts`)
  - Has: `orderId`, `table_id`, `customer_id`, `items` (JSON), `status` (enum), `isPaid`, `billRequestedAt`, `paidAt`
  - Status enum: RECEIVED, PREPARING, READY, COMPLETED, CANCELLED
  - OrderItem interface: `id`, `menuItemId`, `menuItemName`, `quantity`, `unitPrice`, `totalPrice`, `modifiers`, `specialInstructions`

- ✅ **Table** schema exists (`backend/src/schema/table.schema.ts`)
  - Has: UUID `id`, `restaurantId`, `tableNumber`, `capacity`, `location`, `status`, `qrToken`
  - Status: 'active' | 'inactive'

- ✅ **Users** schema exists (`backend/src/schema/user.schema.ts`)
  - Has: UUID `id`, `email`, `full_name`, `role_id`, `status`, `isEmailVerified`
  - Enum UserStatus: ACTIVE, SUSPENDED, DELETED

#### Tasks:
- [ ] **Update Order Schema** (`order.schema.ts`)
  - Add new status values to `OrderStatus` enum:
    - Keep existing: RECEIVED, PREPARING, READY, COMPLETED, CANCELLED
    - Add: `PENDING_ACCEPTANCE` (initial state before waiter accepts)
    - Add: `ACCEPTED` (waiter accepted, before sending to kitchen)
    - Add: `SERVED` (food delivered to customer)
  - Add `waiter_id` column (UUID, nullable, relation to Users)
  - Add `acceptedAt` column (datetime, nullable)
  - Add `sentToKitchenAt` column (datetime, nullable)
  - Add `servedAt` column (datetime, nullable)
  - Update `OrderItem` interface to include:
    - `status` field (PENDING, ACCEPTED, REJECTED, SERVED)
    - `rejectionReason` field (string, optional)
    - `rejectedAt` field (datetime, optional)
  - Add ManyToOne relation to Users (waiter)

- [ ] **Create Bill Schema** (NEW: `backend/src/schema/bill.schema.ts`)
  ```typescript
  @Entity('bills')
  export class Bill {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    @Column({ unique: true })
    billNumber: string; // Format: BILL-YYYYMMDD-XXXX
    
    @Column('uuid')
    table_id: string;
    
    @Column('uuid')
    order_id: string;
    
    @Column('uuid')
    waiter_id: string;
    
    @Column('uuid', { nullable: true })
    restaurant_id: string;
    
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    subtotal: number;
    
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    tax: number;
    
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    discount: number;
    
    @Column({ type: 'enum', enum: ['PERCENTAGE', 'FIXED_AMOUNT'], nullable: true })
    discountType: string;
    
    @Column({ type: 'text', nullable: true })
    discountReason: string;
    
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    total: number;
    
    @Column({ type: 'enum', enum: ['DRAFT', 'PENDING', 'PAID', 'CANCELLED'], default: 'DRAFT' })
    status: string;
    
    @Column({ type: 'enum', enum: ['CASH', 'CARD', 'E_WALLET'], nullable: true })
    paymentMethod: string;
    
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    amountTendered: number; // For cash payments
    
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    change: number; // For cash payments
    
    @Column({ type: 'datetime', nullable: true })
    paidAt: Date;
    
    @CreateDateColumn()
    createdAt: Date;
    
    @UpdateDateColumn()
    updatedAt: Date;
    
    // Relations
    @ManyToOne(() => Table)
    @JoinColumn({ name: 'table_id' })
    table: Table;
    
    @ManyToOne(() => Order)
    @JoinColumn({ name: 'order_id' })
    order: Order;
    
    @ManyToOne(() => Users)
    @JoinColumn({ name: 'waiter_id' })
    waiter: Users;
  }
  ```

- [ ] **Update Table Schema** (`table.schema.ts`)
  - Add `waiter_id` column (UUID, nullable) - assigned waiter
  - Add `current_order_id` column (UUID, nullable) - active order
  - Add `occupancy_status` column (enum: AVAILABLE, OCCUPIED, RESERVED, NEEDS_SERVICE)
  - Update existing `status` to differentiate from `occupancy_status`
  - Add ManyToOne relation to Users (waiter)
  - Add OneToOne relation to Order (current order)

#### Database Migrations:
```bash
# Migration files to create (TypeORM):
# 1. AddWaiterFieldsToOrder
# 2. CreateBillTable
# 3. AddWaiterAndOccupancyToTable
# 4. UpdateOrderStatusEnum

# Commands:
npm run migration:generate -- -n AddWaiterFeatures
npm run migration:run
```

### 1.2 Backend Types & Interfaces
- [ ] Create DTOs in `backend/src/dto/` or module-specific dto folders
  - `AcceptOrderDto` - waiter accepts order
  - `RejectOrderItemDto` - reject specific items with reason
  - `SendToKitchenDto` - send accepted order to kitchen
  - `MarkAsServedDto` - mark order as served to customer
  - `CreateBillDto` - generate bill for table
  - `ApplyDiscountDto` - apply discount to bill
  - `ProcessPaymentDto` - process payment with method
  - `UpdateOrderItemStatusDto` - update individual item status

- [ ] Create response interfaces in respective modules
  - `OrderWithItemsResponse` - order with full item details
  - `BillResponse` - bill with order and payment details
  - `WaiterTableResponse` - table with waiter and order info
  - `WaiterOrderResponse` - order list for waiter view
  - `OrderItemWithStatusResponse` - item with acceptance status

### 1.3 Update Existing Enums
- [ ] Create/Update `backend/src/common/enums/` folder
  - `order-status.enum.ts` - centralized order status enum
  - `order-item-status.enum.ts` - item-level status
  - `bill-status.enum.ts` - bill lifecycle status
  - `payment-method.enum.ts` - payment types
  - `discount-type.enum.ts` - discount calculation types
  - `table-occupancy.enum.ts` - table occupancy states

---

## Phase 2: Core Waiter Features - Order Management (1.5 SP)

### 2.1 Backend - Order Service
**Priority**: High - Core functionality

#### Tasks:
- [ ] **View Pending Orders** (0.25 SP)
  - Create `GET /api/waiter/orders/pending` endpoint
  - Filter orders by status = PENDING
  - Include table information, customer details, order items
  - Sort by creation time (oldest first)
  - Add pagination support

- [ ] **Accept/Reject Order Items** (0.25 SP)
  - Create `POST /api/waiter/orders/:orderId/accept` endpoint
  - Create `POST /api/waiter/orders/:orderId/items/:itemId/reject` endpoint
  - Validate waiter is assigned to the table
  - Update order item status
  - Store rejection reason
  - Send notification to customer (optional)
  - Check if all items rejected → mark order as REJECTED

- [ ] **Send Orders to Kitchen** (0.25 SP)
  - Create `POST /api/waiter/orders/:orderId/send-to-kitchen` endpoint
  - Validate all items are accepted/rejected
  - Update order status to PREPARING
  - Emit WebSocket event to kitchen display system
  - Log order transition for audit trail

- [ ] **View Assigned Tables** (0.25 SP)
  - Create `GET /api/waiter/tables` endpoint
  - Filter tables by waiterId
  - Include current order status, customer count
  - Show table availability status

- [ ] **Mark Orders as Served** (0.25 SP)
  - Create `POST /api/waiter/orders/:orderId/mark-served` endpoint
  - Validate order status is READY
  - Update status to SERVED
  - Record servedAt timestamp
  - Update table status if needed

#### Backend Module Structure:
```
backend/src/waiter/
  ├── waiter.module.ts
  ├── waiter.controller.ts
  ├── waiter.service.ts
  ├── dto/
  │   ├── accept-order.dto.ts
  │   ├── reject-order-item.dto.ts
  │   ├── mark-served.dto.ts
  │   └── send-to-kitchen.dto.ts
  └── guards/
      └── waiter.guard.ts
```

### 2.2 Frontend - Waiter Dashboard
**Priority**: High

#### Tasks:
- [ ] Create waiter layout and navigation
  - `admin-frontend/app/waiter/layout.tsx`
  - Navigation: Orders, Tables, Active Bills

- [ ] **Pending Orders View** (0.25 SP)
  - Create `admin-frontend/app/waiter/orders/page.tsx`
  - Display list of pending orders with cards
  - Show table number, time elapsed, items count
  - Real-time updates using WebSocket/polling
  - Filter by status (pending, preparing, ready)

- [ ] **Order Details & Actions** (0.5 SP)
  - Create order detail modal/page
  - Show all order items with details
  - Accept/Reject buttons for individual items
  - Rejection reason modal
  - "Send to Kitchen" button when items processed
  - Status indicators with colors

- [ ] **My Tables View** (0.25 SP)
  - Create `admin-frontend/app/waiter/tables/page.tsx`
  - Grid/List view of assigned tables
  - Color-coded by status (available, occupied, needs attention)
  - Quick actions (view orders, create bill)
  - Real-time status updates

- [ ] **Mark as Served** (0.25 SP)
  - Add "Mark as Served" button in order details
  - Confirmation modal
  - Update UI after successful marking
  - Show notification

#### Frontend Components:
```
admin-frontend/shared/components/waiter/
  ├── OrderCard.tsx
  ├── OrderItemsList.tsx
  ├── RejectItemModal.tsx
  ├── TableCard.tsx
  ├── TableGrid.tsx
  └── OrderStatusBadge.tsx
```

---

## Phase 3: Bill Management System (2.0 SP)

### 3.1 Backend - Bill Service
**Priority**: High - Critical for payment flow

#### Tasks:
- [ ] **Create Bill for Table** (0.25 SP)
  - Create `POST /api/waiter/bills` endpoint
  - Generate unique bill number (format: BILL-YYYYMMDD-XXXX)
  - Fetch all SERVED orders for the table
  - Calculate subtotal from order items
  - Calculate tax (configurable percentage)
  - Initialize bill with DRAFT status
  - Return bill with full details

- [ ] **Apply Discounts** (0.25 SP)
  - Create `PATCH /api/waiter/bills/:billId/discount` endpoint
  - Support percentage discount (e.g., 10%)
  - Support fixed amount discount (e.g., $5.00)
  - Validate discount doesn't exceed subtotal
  - Recalculate total
  - Log discount application with reason

- [ ] **Process Payment** (0.25 SP)
  - Create `POST /api/waiter/bills/:billId/payment` endpoint
  - Accept payment method (CASH, CARD, E_WALLET)
  - Mark bill as PAID
  - Record paidAt timestamp
  - Update table status to AVAILABLE
  - Update order status to COMPLETED
  - Generate payment receipt

- [ ] **Bill Management APIs** (0.25 SP)
  - `GET /api/waiter/bills` - List all bills (with filters)
  - `GET /api/waiter/bills/:billId` - Get bill details
  - `GET /api/waiter/bills/table/:tableId` - Get active bill for table
  - `DELETE /api/waiter/bills/:billId` - Cancel bill (DRAFT only)
  - Add bill history and audit logs

#### Backend Module Structure:
```
backend/src/bill/
  ├── bill.module.ts
  ├── bill.controller.ts
  ├── bill.service.ts
  ├── dto/
  │   ├── create-bill.dto.ts
  │   ├── apply-discount.dto.ts
  │   └── process-payment.dto.ts
  └── entities/
      └── bill.entity.ts
```

### 3.2 Frontend - Bill Management UI
**Priority**: High

#### Tasks:
- [ ] **Create Bill Interface** (0.25 SP)
  - Create `admin-frontend/app/waiter/bills/create/page.tsx`
  - Select table from assigned tables
  - Show all orders for the table
  - Display itemized list with prices
  - Show subtotal, tax, total calculation
  - "Generate Bill" button
  - Success confirmation

- [ ] **Bill Details & Editing** (0.25 SP)
  - Create `admin-frontend/app/waiter/bills/[billId]/page.tsx`
  - Display bill header (number, date, table, waiter)
  - Itemized list of orders
  - Price breakdown section
  - Apply discount form
  - Payment processing section
  - Status indicator

- [ ] **Discount Application** (0.25 SP)
  - Discount form component
  - Toggle between percentage/fixed amount
  - Input validation
  - Live total recalculation preview
  - Optional discount reason field
  - Apply/Reset buttons

- [ ] **Payment Processing** (0.25 SP)
  - Payment method selector (Cash/Card/E-Wallet)
  - Amount tendered input (for cash)
  - Change calculation
  - "Process Payment" button with confirmation
  - Success modal with option to print
  - Redirect after payment

#### Frontend Components:
```
admin-frontend/shared/components/bills/
  ├── BillForm.tsx
  ├── BillHeader.tsx
  ├── BillItemsList.tsx
  ├── BillSummary.tsx
  ├── DiscountForm.tsx
  ├── PaymentForm.tsx
  └── PaymentMethodSelector.tsx
```

---

## Phase 4: Print Functionality & PDF Generation (0.5 SP)

### 4.1 Backend - Print Service
**Priority**: Medium

#### Tasks:
- [ ] **Print Bill** (0.25 SP)
  - Install PDF generation library (e.g., PDFKit, Puppeteer)
  - Create `GET /api/waiter/bills/:billId/pdf` endpoint
  - Generate formatted bill PDF
  - Include restaurant branding/logo
  - Itemized list with prices
  - Tax and discount breakdown
  - Payment method and timestamp
  - Support different paper sizes (A4, thermal 80mm)

- [ ] **Thermal Printer Integration** (Optional)
  - Research thermal printer protocols (ESC/POS)
  - Create printer service for direct printing
  - Configure printer endpoints
  - Handle printer errors gracefully

### 4.2 Frontend - Print Features
**Priority**: Medium

#### Tasks:
- [ ] **Print Button** (0.25 SP)
  - Add "Print Bill" button in bill details
  - Download PDF option
  - Print preview modal
  - Direct browser print option
  - Print receipt after payment (optional)
  - Loading states during generation

---

## Phase 5: Testing, Polish & Deployment (0.5 SP)

### 5.1 Testing
**Priority**: High

#### Tasks:
- [ ] **Backend Unit Tests**
  - Test all waiter service methods
  - Test bill calculation logic
  - Test discount application
  - Test order status transitions
  - Mock database and external services

- [ ] **Backend E2E Tests**
  - Test complete order workflow
  - Test bill creation and payment flow
  - Test edge cases (rejected orders, cancelled bills)
  - Test authorization (waiter-only endpoints)

- [ ] **Frontend Component Tests**
  - Test order components rendering
  - Test bill calculation display
  - Test form validations
  - Test user interactions

- [ ] **Integration Testing**
  - Test waiter accepting order → kitchen receives
  - Test order served → bill creation
  - Test payment → table freed → order completed
  - Test real-time updates

### 5.2 Polish & UX
**Priority**: Medium

#### Tasks:
- [ ] Add loading states for all async operations
- [ ] Add error handling and user-friendly messages
- [ ] Add success notifications
- [ ] Implement optimistic UI updates
- [ ] Add keyboard shortcuts for common actions
- [ ] Mobile responsiveness for tablet waiters
- [ ] Accessibility (ARIA labels, keyboard navigation)

### 5.3 Documentation
**Priority**: Medium

#### Tasks:
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Waiter user guide (how to use features)
- [ ] Admin guide (managing waiters, tables)
- [ ] Troubleshooting guide
- [ ] Update README files

### 5.4 Deployment
**Priority**: High

#### Tasks:
- [ ] Run database migrations in staging
- [ ] Deploy backend to staging
- [ ] Deploy frontend to staging
- [ ] Conduct UAT (User Acceptance Testing)
- [ ] Fix bugs from UAT
- [ ] Deploy to production
- [ ] Monitor for errors
- [ ] Gather waiter feedback

---

## Dependencies & Prerequisites

### Before Starting:
1. **User Management**: Waiter role must exist in the system
2. **Authentication**: Waiter login and JWT auth working
3. **Table Management**: Tables can be created and assigned to waiters
4. **Menu Management**: Menu items must be available
5. **Customer Ordering**: Customers can place orders

### External Dependencies:
- PDF generation library
- WebSocket/Socket.io for real-time updates (optional)
- Thermal printer drivers (optional)
- Tax calculation rules/configuration

---

## Risk Mitigation

### Potential Issues:
1. **Race Conditions**: Multiple waiters accessing same order
   - **Solution**: Implement optimistic locking, show who's editing

2. **Payment Conflicts**: Bill paid but not marked in system
   - **Solution**: Idempotent payment endpoints, transaction logs

3. **Printer Failures**: Thermal printer offline during peak hours
   - **Solution**: Fallback to PDF download, queue print jobs

4. **Real-time Sync**: Orders not updating in real-time
   - **Solution**: Implement WebSocket with fallback polling

5. **Discount Abuse**: Waiters applying excessive discounts
   - **Solution**: Add discount limits, require manager approval, audit logs

---

## Success Metrics

### KPIs to Track:
- Average time from order placement to kitchen (target: <2 minutes)
- Order rejection rate (target: <5%)
- Average time from ready to served (target: <3 minutes)
- Bill generation time (target: <30 seconds)
- Payment processing time (target: <1 minute)
- Waiter app crash rate (target: <1%)

---

## Phase Summary

| Phase | Focus Area | Story Points | Priority |
|-------|-----------|--------------|----------|
| 1 | Foundation & Database | 0.5 | Critical |
| 2 | Core Waiter Features | 1.5 | High |
| 3 | Bill Management | 2.0 | High |
| 4 | Print Functionality | 0.5 | Medium |
| 5 | Testing & Deployment | 0.5 | High |
| **Total** | | **5.0** | |

## Recommended Implementation Order

1. **Sprint 1**: Phase 1 + Phase 2.1 (Backend order management)
2. **Sprint 2**: Phase 2.2 (Frontend waiter dashboard) + Phase 3.1 (Backend bills)
3. **Sprint 3**: Phase 3.2 (Frontend bills) + Phase 4 (Printing) + Phase 5 (Testing)

---

## Notes

- Consider adding manager approval workflow for large discounts
- Think about shift management (waiter clock in/out)
- Consider tips/gratuity handling
- Plan for split bills feature (future enhancement)
- Consider table transfer between waiters
- Add reporting for waiter performance metrics

---

**Last Updated**: January 11, 2026  
**Status**: Planning Phase  
**Owner**: Development Team
