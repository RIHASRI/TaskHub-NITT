# 🗂️ Multi-Tenant Task Management System

A production-quality full-stack task management application with strict **multi-tenancy**, **RBAC (Role-Based Access Control)**, and **JWT authentication**.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    REACT FRONTEND                   │
│   Login → Dashboard → Task List → User Management  │
└────────────────────┬────────────────────────────────┘
                     │ REST API (JSON)
┌────────────────────▼────────────────────────────────┐
│                EXPRESS BACKEND                      │
│  [Auth MW] → [Tenant MW] → [RBAC MW] → [Controller]│
└────────────────────┬────────────────────────────────┘
                     │ pg (node-postgres)
┌────────────────────▼────────────────────────────────┐
│              POSTGRESQL DATABASE                    │
│   tenants | users | tasks  (shared DB + tenant_id) │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- PostgreSQL 14+
- npm

### 1. Clone & Install

```bash
git clone https://github.com/yourname/multitenant-tasks.git
cd multitenant-tasks

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Database Setup

```bash
# Create DB
psql -U postgres -c "CREATE DATABASE taskdb;"

# Run migrations
psql -U postgres -d taskdb -f backend/src/db/schema.sql
```

### 3. Environment Variables

```bash
# backend/.env
DATABASE_URL=postgresql://postgres:password@localhost:5432/taskdb
JWT_SECRET=your_super_secret_key_here
PORT=4000
```

### 4. Run

```bash
# Backend (from /backend)
npm run dev        # starts on :4000

# Frontend (from /frontend)
npm start          # starts on :3000
```

---

## 🏢 Multi-Tenancy Strategy

**Approach: Shared Database with `tenant_id` column (Discriminator Column pattern)**

Every row in `users` and `tasks` carries a `tenant_id` foreign key. All queries are automatically scoped by a middleware that extracts the tenant from the JWT and injects it into `req.tenantId`. Controllers never query without this scope.

**Why this approach?**
- ✅ Simpler ops — one DB to manage
- ✅ Cost-effective for a demo/startup scale
- ✅ Easy to migrate to per-schema later
- ⚠️ Requires disciplined query scoping (handled via middleware)

---

## 🔐 RBAC Design

| Role    | View Tasks | Create Task | Update Own Task | Update Any Task | Manage Users |
|---------|-----------|-------------|-----------------|-----------------|--------------|
| Admin   | ✅         | ✅           | ✅               | ✅               | ✅            |
| Member  | ✅         | ✅           | ✅               | ❌               | ❌            |
| Viewer  | ✅         | ❌           | ❌               | ❌               | ❌            |

Roles are enforced via `requireRole(...roles)` middleware on every route.

---

## 📁 Project Structure

```
multitenant-task-mgmt/
├── backend/
│   ├── src/
│   │   ├── config/       # DB connection
│   │   ├── middleware/   # auth, tenant, rbac
│   │   ├── routes/       # auth, users, tasks
│   │   ├── controllers/  # business logic
│   │   └── db/           # schema.sql
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/          # axios instance
│   │   ├── context/      # AuthContext
│   │   ├── components/   # ProtectedRoute, TaskCard, etc.
│   │   └── pages/        # Login, Dashboard, Tasks
│   └── package.json
└── README.md
```

---

## 🔒 Security Highlights

- JWT tokens include `userId`, `tenantId`, and `role` — no separate DB lookup needed per request
- All task queries are double-scoped: `WHERE tenant_id = $1 AND ...`
- Passwords hashed with `bcrypt` (12 rounds)
- Input validated before any DB operation
- CORS restricted to frontend origin in production

---

## 📬 Sample API Calls (Postman)

### Register
```
POST /api/auth/register
Body: { "name": "Alice", "email": "alice@acme.com", "password": "pass123", "tenantSlug": "acme" }
```

### Login
```
POST /api/auth/login
Body: { "email": "alice@acme.com", "password": "pass123" }
Response: { "token": "eyJ..." }
```

### Get Tasks (Auth required)
```
GET /api/tasks?status=pending
Headers: { "Authorization": "Bearer eyJ..." }
```

### Create Task (Member/Admin)
```
POST /api/tasks
Headers: { "Authorization": "Bearer eyJ..." }
Body: { "title": "Build login page", "description": "...", "assigneeId": 3, "status": "pending" }
```
