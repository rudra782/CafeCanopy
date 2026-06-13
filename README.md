# CafeCanopy - Restaurant Point of Sale (POS) & Management System

CafeCanopy is a modern, full-stack, web-based Restaurant Point of Sale (POS) system. It features a complete Admin Backend, POS Terminal, Kitchen Display System (KDS), Reporting Dashboard, and Role-Based Access Control.

---

## 🛠️ Prerequisites

Before you start, make sure you have the following installed:
- **Node.js** (v18 or higher recommended)
- **PostgreSQL** database (Local instance or [Neon PostgreSQL](https://neon.tech))

---

## 📂 Project Structure

```text
CafeCanopy/
├── client/          # Frontend application (React, Vite, TypeScript, Tailwind)
└── server/          # Backend API application (Node.js, Express, TypeScript, pg)
```

---

## 🚀 Setup & Installation

Follow these steps to set up and run the application locally:

### 1. Database Setup

Ensure PostgreSQL is running and create a database named `cafecanopy` (or use your preferred database name).

### 2. Backend Setup

1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your environment variables. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
4. Open the `.env` file and update the following settings:
   - **`DATABASE_URL`**: Update this with your PostgreSQL connection string.
     - *Example (Local):* `postgresql://username:password@localhost:5432/cafecanopy`
     - *Example (Neon Cloud):* `postgresql://user:password@ep-xxx.neon.tech/cafecanopy?sslmode=require`
   - **`JWT_SECRET`** & **`JWT_REFRESH_SECRET`**: Generate random hex strings for secure authentication token signing:
     ```bash
     node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
     ```
   - **Cloudinary settings** (Optional, for image uploads): Register on [Cloudinary](https://cloudinary.com) and fill in your Cloud Name, API Key, and API Secret.
   - **Email settings** (Optional, for receipt/system emails): Set your SMTP host, user, and password details.

5. Run database migrations to create the database schema:
   ```bash
   npm run db:migrate
   ```

### 3. Frontend Setup

1. Navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the environment variables. Copy `.env` from `.env.example` if available, or make sure `.env` contains:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   VITE_APP_NAME=CafeCanopy
   ```

---

## 💻 Running the Application

To run both the backend server and frontend client in development mode, open two terminal windows:

### Terminal 1: Backend
```bash
cd server
npm run dev
```
The server API will start on [http://localhost:5000](http://localhost:5000).

### Terminal 2: Frontend
```bash
cd client
npm run dev
```
The Vite development server will start on [http://localhost:5173](http://localhost:5173).

---

## 🔑 Initial Credentials / Admin Login

Once the database migrations are completed, you can use the default/seeded roles:
- Check `server/src/db/schema.sql` for the database schema definition.
- You can create your first admin account via the registration flow or direct database insert.
