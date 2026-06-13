# 🌿 CafeCanopy

> **Modern, Premium Full-Stack Restaurant Point of Sale (POS) & Management System**

CafeCanopy is a state-of-the-art, web-based restaurant management system built to deliver lightning-fast checkout operations, real-time kitchen dispatching, and comprehensive sales analytics. Featuring a dual-panel desktop layout, dynamic QR-based UPI payment processing, and automatic offline fallback, CafeCanopy streamlines café and restaurant operations from table seating to payment settlement.

---

## 🚀 Key Features

* **📦 Unified POS Terminal**: Clean scrollable product list sorted by categories, instant search across all items, dynamic cart modifications, and direct table/customer selection.
* **⚡ Real-time Kitchen Display System (KDS)**: Instant synchronization of orders from the POS terminal to the kitchen staff using WebSockets.
* **📊 Comprehensive Reporting & Analytics**: Real-time sales charts, revenue breakdown by payment method, and employee performance tracking.
* **💳 QR-Based UPI Payments**: Automatic QR code generator dynamically scaling to show the exact checkout bill amount with env-configured UPI merchant IDs.
* **🔐 Role-Based Access Control (RBAC)**: Secure access segments for `Admin`, `Employee` (Cashier), `Kitchen` (Chef), and `Customer` roles.
* **🏢 Space & Floor Management**: Multi-floor layout configuration (`Main Floor`, `Rooftop Canopy`) with interactive table seating statuses.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons, Socket.io-client |
| **Backend** | Node.js, Express, TypeScript, Socket.io, pg (node-postgres), bcryptjs |
| **Database** | PostgreSQL (Supports Local & Neon Serverless) |
| **Infrastructure** | Environment-based configuration, Cloudinary integration (image upload) |

---

## 📂 Project Structure

```text
CafeCanopy/
├── client/                 # Frontend Application (Vite + React)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── layouts/        # Page layout templates
│   │   ├── lib/            # Axios API config & Socket.io connections
│   │   ├── pages/          # POSTerminal, LoginPage, Admin Dashboard, etc.
│   │   ├── store/          # Zustand client state management
│   │   └── index.css       # Core typography, custom variables & base styling
│   └── .env.example        # Example client configuration variables
│
└── server/                 # Backend API Application (Express + Node)
    ├── src/
    │   ├── controllers/    # Route controllers (Admin, POS, Auth)
    │   ├── db/             # Database connection, schemas & seed scripts
    │   ├── middleware/     # JWT Auth & route guards
    │   ├── routes/         # Express API endpoints
    │   └── services/       # File upload & helper integrations
    └── .env.example        # Example server configuration variables
```

---

## ⚙️ Setup & Installation

### 1. Prerequisites
Make sure you have the following installed on your machine:
* **Node.js** (v18 or higher)
* **PostgreSQL 17** (Local service or a cloud-hosted database like [Neon Database](https://neon.tech))

---

### 2. Backend Setup
1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` and fill in your variables:*
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/cafecanopy"
   JWT_SECRET="generate-with-command-below"
   JWT_REFRESH_SECRET="generate-with-command-below"
   DEFAULT_UPI_ID="yourname@upi" # Used for generating dynamic checkout QR codes
   ```
   *To generate JWT secrets, run:*
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

4. Create the schema and migrate the database:
   ```bash
   npm run db:migrate
   ```
5. Seed the database with the pre-configured categories and 184+ products:
   ```bash
   npm run db:seed
   ```

---

### 3. Frontend Setup
1. Navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Create a `.env` file containing:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   VITE_APP_NAME=CafeCanopy
   ```

---

## 💻 Running the Application

Open two terminals and start the development servers:

#### Terminal 1: Start Backend API
```bash
cd server
npm run dev
```
*API runs at:* `http://localhost:5000`

#### Terminal 2: Start Frontend App
```bash
cd client
npm run dev
```
*App runs at:* `http://localhost:5173`

---

## 🔑 Default Credentials

The seed script initializes three default users with different authorization tiers:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@cafecanopy.com` | `admin123` |
| **Cashier / Employee** | `cashier@cafecanopy.com` | `pos123` |
| **Kitchen / Chef** | `kitchen@cafecanopy.com` | `kitchen123` |

---

## 🛡️ License

Distributed under the MIT License. See `LICENSE` for more information.
