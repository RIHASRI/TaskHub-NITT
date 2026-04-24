-- ============================================================
-- Multi-Tenant Task Management System - Database Schema
-- Strategy: Shared DB with tenant_id discriminator column
-- ============================================================

-- TENANTS table (one row per organization)
CREATE TABLE tenants (
    id        SERIAL PRIMARY KEY,
    name      VARCHAR(100) NOT NULL,
    slug      VARCHAR(50)  NOT NULL UNIQUE,  -- e.g. "acme-corp"
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- USERS table (scoped to a tenant)
CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    tenant_id   INTEGER      NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL,
    password    VARCHAR(255) NOT NULL,   -- bcrypt hash
    role        VARCHAR(20)  NOT NULL DEFAULT 'member'
                             CHECK (role IN ('admin', 'member', 'viewer')),
    created_at  TIMESTAMPTZ  DEFAULT NOW(),
    UNIQUE (tenant_id, email)            -- email unique PER tenant
);

-- TASKS table (scoped to a tenant, optionally assigned to a user)
CREATE TABLE tasks (
    id          SERIAL PRIMARY KEY,
    tenant_id   INTEGER      NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    creator_id  INTEGER      NOT NULL REFERENCES users(id),
    assignee_id INTEGER      REFERENCES users(id),
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    status      VARCHAR(20)  NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'in_progress', 'done')),
    created_at  TIMESTAMPTZ  DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_users_tenant       ON users(tenant_id);
CREATE INDEX idx_tasks_tenant       ON tasks(tenant_id);
CREATE INDEX idx_tasks_status       ON tasks(tenant_id, status);
CREATE INDEX idx_tasks_assignee     ON tasks(assignee_id);

-- ============================================================
-- ER DIAGRAM (text)
-- ============================================================
--
--  tenants
--  ├── id (PK)
--  ├── name
--  └── slug (UNIQUE)
--       │
--       │ 1:N
--  users
--  ├── id (PK)
--  ├── tenant_id (FK → tenants.id)
--  ├── name, email, password
--  └── role: admin | member | viewer
--       │
--       │ 1:N (creator)
--  tasks
--  ├── id (PK)
--  ├── tenant_id (FK → tenants.id)   ← isolation key
--  ├── creator_id  (FK → users.id)
--  ├── assignee_id (FK → users.id, nullable)
--  ├── title, description
--  ├── status: pending | in_progress | done
--  └── created_at, updated_at
