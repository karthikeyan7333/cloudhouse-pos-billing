# CloudHouse POS - Textile & Retail Billing Software
*Technical Interview Assignment for CloudHouse Technologies*

A production-grade, full-stack Point of Sale (POS) and Enterprise Billing Software tailored specifically for textile, garment, and retail businesses.

---

## 1. Project Overview

CloudHouse POS is a comprehensive retail management platform designed to handle multi-variant garment inventory, fast cashier checkout, statutory GST calculations, returns with restock disposition, double-entry financial ledger accounting, and executive analytics.

### Key Capabilities
- **Fast POS Billing Terminal (`/pos`)**: High-speed textile variant selection (sizes, colors), barcode scanning, automatic GST tax calculation, item discounts, cash tendered & change due calculation, and instant thermal receipt printing.
- **Complete Desktop Admin Portal (`/admin/*`)**: Real-time sales telemetry, full product CRUD with variant management and stock audit logs, department category taxonomy, staff/cashier management with last-admin protection, supplier directory, partial & full return processing with restock dispositions, double-entry financial ledger, and multi-period reports with CSV export.
- **Dedicated Mobile Admin Web App (`/admin/mobile`)**: A purpose-built, responsive mobile-app-style layout with bottom tab navigation, quick product creation, mobile return authorization, and touch-optimized access to all administrative modules.
- **Security & Authorization**: JWT-based session management, bcrypt password hashing, role-based backend route guards (`admin` vs `staff`), authentication rate limiting, and protection for the last remaining active administrator.

---

## 2. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, React Router 7, Axios, Lucide Icons, Plus Jakarta Sans & JetBrains Mono typography.
- **Backend**: Node.js, Express.js REST API with modular controllers, services, and middleware (`tsx`).
- **Database & Persistence**:
  - **MongoDB Atlas** / **Mongoose**: Validated schemas, indexes, timestamps, and model definitions for Users, Products, Categories, Suppliers, Bills, Returns, Inventory Movements, Ledger Entries, and Business Settings.
  - **Resilient Fallback Storage Engine**: If `MONGODB_URI` is not configured or in offline sandbox environments, the system seamlessly initializes a persistent file-backed JSON engine (`data/pos_database.json`) with zero downtime.
- **Authentication & Security**: JSON Web Tokens (JWT) with 24-hour expiration, bcrypt password hashing (10 salt rounds), IP-based rate limiting on auth endpoints, and server-side role validation.

---

## 3. URLs & Demo Links

- **Live Application URL**: `https://ais-dev-7dh5mto4bvoent5zienkbz-46535382536.asia-southeast1.run.app`
- **Direct Mobile Admin URL**: `https://ais-dev-7dh5mto4bvoent5zienkbz-46535382536.asia-southeast1.run.app/admin/mobile`
- **POS Terminal URL**: `https://ais-dev-7dh5mto4bvoent5zienkbz-46535382536.asia-southeast1.run.app/pos`
- **Health Check Endpoint**: `https://ais-dev-7dh5mto4bvoent5zienkbz-46535382536.asia-southeast1.run.app/api/health`

---

## 4. Test Credentials

The database automatically seeds with default accounts on first startup:

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **Admin** | `admin@cloudhousepos.com` | `Admin@123` | Full Admin Portal, `/admin/mobile`, POS, Reports, Ledger, Settings |
| **Staff / Cashier** | `staff@cloudhousepos.com` | `Staff@123` | POS Billing Register (`/pos`) & Transaction History |

> **Pro Tip**: The login page includes convenient **"Fill Admin"**, **"Fill Staff"**, and **"Instant Admin Demo Login"** buttons for rapid evaluation.

---

## 5. Authentication Strategy & Role-Based Access

### Staff Security:
- **Mandatory Authentication**: Staff must log in with valid credentials before accessing the POS billing portal.
- **Backend Validation**: Passwords are encrypted with bcrypt (`salt = 10`). JWT tokens are verified in `authenticateToken` middleware.
- **Least Privilege Access**: Staff are authorized for billing checkout and transaction history viewing only. Any attempt to invoke administrative APIs returns HTTP `403 Forbidden`.
- **Zero Secrets in Frontend**: Secrets and API keys are strictly kept server-side in environment variables.

### Admin Security & Development Workflow:
- **Development Experience**: Fast 1-click dev demo login is available on the login page for evaluator convenience.
- **Production Protection**: All administrative endpoints (`/api/products`, `/api/categories`, `/api/staff`, `/api/suppliers`, `/api/returns`, `/api/ledger`, `/api/reports`, `/api/settings`) enforce `authenticateToken` and `requireAdmin` server-side middleware.
- **Verifying Admin Login in Production**: Deploy with `NODE_ENV=production`. Unauthenticated requests to `/admin` or `/admin/mobile` are rejected and redirected to `/login`.

---

## 6. Idempotent Database Seed & Migration

The seeding script located at `server/seed/seedData.ts` is **100% idempotent**:
1. Checks for existing Admin (`admin@cloudhousepos.com`) and Staff (`staff@cloudhousepos.com`) accounts before creation.
2. Checks categories by code (`SILK`, `MSHIRT`, `WETHNIC`, `FABRICS`, `ACC`). Existing categories are preserved without duplicates.
3. Checks suppliers by code (`SUP-KANCHI`, `SUP-ARVIND`, `SUP-RAYMOND`). Existing suppliers are preserved.
4. Checks products by unique SKU (`SILK-KNC-001`, `SHRT-LIN-002`, `KURT-CHN-003`, `FAB-RAY-004`, `ACC-PSH-005`).
5. Only inserts opening capital ledger entry and sample bill if the respective tables are empty.

### Running Seed / Migration Manually:
```bash
npx tsx -e "import { seedDatabase } from './server/seed/seedData.js'; seedDatabase().then(() => process.exit(0));"
```

---

## 7. Local Setup & Installation

### Prerequisites
- Node.js ^20.19.0 or >=22.12.0 (required by Vite 8)
- npm >= 9.x

### Steps

1. **Clone repository**:
   ```bash
   git clone <repository-url>
   cd cloudhouse-pos
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Configure your environment variables:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/cloudhouse_pos?retryWrites=true&w=majority
   JWT_SECRET=your_secure_random_jwt_secret_key
   ADMIN_EMAIL=admin@cloudhousepos.com
   ADMIN_PASSWORD=Admin@123
   STAFF_EMAIL=staff@cloudhousepos.com
   STAFF_PASSWORD=Staff@123
   VITE_API_URL=/api
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   The application runs at `http://localhost:3000`.

5. **Run Automated Test Suite**:
   ```bash
   npm test
   ```

6. **Production Build & Run**:
   ```bash
   npm run build
   npm start
   ```

---

## 8. Verification & Automated Test Suite

Run the built-in automated test suite:
```bash
npm test
```

The test runner (`scripts/test_pos_workflows.ts`) verifies all key requirements against the running server:
- [x] **1. Server Health Check**: Validates `/api/health` status and DB connection.
- [x] **2. Admin Login**: Authenticates admin user and returns signed JWT token.
- [x] **3. Staff Login**: Authenticates staff user and assigns role `staff`.
- [x] **4. Invalid Credentials**: Rejects wrong password with HTTP `401 Unauthorized`.
- [x] **5. Role-Based Authorization**: Blocks staff token from admin product creation with HTTP `403 Forbidden`.
- [x] **6. Product CRUD**: Creates textile product with variants and retrieves accurate attributes.
- [x] **7. POS Checkout**: Processes customer bill, calculates GST, and decrements stock quantity.
- [x] **8. Negative Stock Prevention**: Rejects checkout attempt exceeding available variant stock.
- [x] **9. Partial Return**: Processes 1-unit return, issues credit, and restocks inventory.
- [x] **10. Return Validation**: Rejects attempts to return more items than originally purchased.
- [x] **11. Ledger Synchronization**: Verifies double-entry journal (Credit for Sale, Debit for Return).
- [x] **12. Analytics Reports**: Derives gross sales, refunds, and net metrics from actual database records.

---

## 9. Architecture & Folder Structure

```
├── server.ts                       # Main Express server & Vite integration
├── server/
│   ├── config/
│   │   └── db.ts                   # Database connection with fallback resilience
│   ├── models/
│   │   ├── User.ts                 # Admin and Staff Mongoose schema
│   │   ├── Product.ts              # Textile products with size/color variants
│   │   ├── Category.ts             # Department categories
│   │   ├── Supplier.ts             # Textile mills & suppliers
│   │   ├── Bill.ts                 # Completed invoices with immutable item snapshots
│   │   ├── Return.ts               # Product returns & restock disposition
│   │   ├── InventoryMovement.ts    # Stock audit logs with reasons
│   │   ├── LedgerEntry.ts          # Double-entry financial journal
│   │   └── BusinessSetting.ts      # Store profile, GSTIN, receipt template
│   ├── controllers/                # Auth, Products, Billing, Returns, Ledger, Reports
│   ├── middleware/
│   │   └── auth.ts                 # JWT verification, role authorization, rate limiter
│   ├── routes/
│   │   └── api.ts                  # REST API endpoints (/api/*)
│   ├── seed/
│   │   └── seedData.ts             # Idempotent demo catalog & accounts
│   └── storage/
│       └── store.ts                # File-backed persistence engine
├── src/
│   ├── components/
│   │   ├── common/                 # Modal, ConfirmDialog, StatCard, ReceiptModal, Pagination
│   │   └── layout/                 # AdminLayout, PosLayout, ProtectedRoute
│   ├── context/
│   │   ├── AuthContext.tsx         # User state & authentication
│   │   └── NotificationContext.tsx # Toast notification system
│   ├── pages/
│   │   ├── LoginPage.tsx           # Authentication with 1-click test credentials
│   │   ├── pos/PosPage.tsx         # Fast POS billing register with GST & receipt printing
│   │   └── admin/                  # Dashboard, Products, Categories, Staff, Suppliers, Returns,
│   │                               # Transactions, Ledger, Reports, Settings, and /mobile
│   └── types/index.ts              # TypeScript domain types
├── scripts/
│   └── test_pos_workflows.ts       # Automated integration test runner
└── README.md
```

---

## 10. Deployment Guide

### Deploying to Render / Google Cloud Run / Heroku:
1. **Build Command**: `npm run build`
2. **Start Command**: `npm start`
3. **Environment Variables**:
   - `NODE_ENV=production`
   - `PORT=3000` (or platform default)
   - `MONGODB_URI=<Your MongoDB Atlas Connection String>`
   - `JWT_SECRET=<Your Production Secret>`
   - `CLIENT_URL=<Your Public Domain URL>`
   - `ADMIN_EMAIL=admin@cloudhousepos.com`
   - `ADMIN_PASSWORD=<Your Admin Password>`
   - `STAFF_EMAIL=staff@cloudhousepos.com`
   - `STAFF_PASSWORD=<Your Staff Password>`

---

## 11. Assumptions & Known Limitations

- **Payment Recording**: The POS acts as a payment *recording* system for Cash, Card, and UPI. Physical card terminal swipes and UPI QR payments are confirmed at the physical register; external banking gateway popups are not simulated without actual merchant credentials.
- **Barcode Hardware**: Barcode inputs support standard USB/Bluetooth handheld HID barcode scanners that send an `Enter` keypress following the barcode string.
- **Timezone**: All receipts, transactions, and audit entries standardize on Indian Standard Time (`Asia/Kolkata`).
