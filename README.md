# OrderFlow

A mini e-commerce order management system with inventory reservation, idempotent order creation, and an admin dashboard.

## Features

- **Transactional Order Creation** - PostgreSQL transactions with FOR UPDATE row locks prevent overselling
- **Idempotency Keys** - Prevents duplicate orders from double-clicks and network retries
- **Order State Machine** - Created → Paid → Shipped → Delivered → Cancelled
- **Stock Management** - Automatic decrement on order, restore on cancellation
- **Product Catalog** - Browse and search products
- **Admin Dashboard** - Revenue analytics, order management, stock alerts

## Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL
- **Frontend**: React, Vite, TypeScript, Tailwind CSS
- **Charts**: Recharts
- **Testing**: Jest, Supertest

## Setup

1. Clone and install:
   ```bash
   git clone https://github.com/0535MANIDEEP/orderflow.git
   cd orderflow/server && npm install
   cd ../client && npm install
   ```

2. Create database:
   ```bash
   psql -U postgres -c "CREATE DATABASE orderflow;"
   ```

3. Seed data:
   ```bash
   cd server && npm run seed
   ```

4. Start servers:
   ```bash
   # Terminal 1
   cd server && npm run dev
   # Terminal 2
   cd client && npm run dev
   ```

5. Open http://localhost:5173

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/products | List products |
| POST | /api/products | Create product |
| POST | /api/orders | Create order (requires Idempotency-Key header) |
| GET | /api/orders | List orders |
| PUT | /api/orders/:id/status | Update order status |
| GET | /api/admin/stats | Dashboard statistics |
| GET | /api/admin/revenue | Revenue analytics |

## Key Design Decisions

### FOR UPDATE Row Locks
```sql
SELECT * FROM products WHERE id = $1 FOR UPDATE
```
Acquires a row lock to prevent concurrent transactions from modifying stock simultaneously.

### Idempotency
Each order request includes a unique `Idempotency-Key` header. If the same key is used twice, the existing order is returned instead of creating a duplicate.

### Order State Machine
Valid transitions: created → paid → shipped → delivered, created → paid → cancelled
