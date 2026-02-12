# PostgreSQL Quick Setup Guide

## Step 1: Install PostgreSQL

### macOS
```bash
brew install postgresql@16
brew services start postgresql@16
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Windows
Download from: https://www.postgresql.org/download/windows/

---

## Step 2: Create Database & User

Choose one of the methods below:

### Option A: Using Setup Script (Recommended)

```bash
# Connect as postgres superuser
psql -U postgres

# Then run:
\i database/setup.sql
```

### Option B: Manual Setup

```bash
# Connect to PostgreSQL
psql -U postgres

# Run these commands:
CREATE USER writer_user WITH ENCRYPTED PASSWORD 'your_secure_password';
CREATE DATABASE writer_db OWNER writer_user;
GRANT ALL PRIVILEGES ON DATABASE writer_db TO writer_user;
\connect writer_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
\q
```

---

## Step 3: Load Schema (Choose ONE method)

### Method 1: Using Prisma (Recommended for Next.js)

```bash
# 1. Copy .env file
cp .env.example .env.local

# 2. Update DATABASE_URL in .env.local:
# DATABASE_URL="postgresql://writer_user:your_password@localhost:5432/writer_db"

# 3. Run Prisma migrations
npm run db:migrate

# 4. Seed the database
npm run db:seed
```

### Method 2: Using Raw SQL

```bash
# Load the schema
psql -U writer_user -d writer_db -f database/schema.sql
```

---

## Step 4: Verify Setup

```bash
# Test connection
psql -U yuhangbin -d writer -c "SELECT version();"

# View tables
psql -U writer_user -d writer_db -c "\dt"

# View AI models
psql -U writer_user -d writer_db -c "SELECT * FROM ai_models;"
```

---

## Useful Commands

```bash
# Prisma Studio (GUI for database)
npm run db:studio

# Reset database (WARNING: deletes all data)
npm run db:reset

# Re-seed data
npm run db:seed

# Generate Prisma client
npx prisma generate
```

---

## Project Structure

```
writer/
├── database/
│   ├── schema.sql      # Raw SQL schema
│   ├── setup.sql       # Database setup script
│   └── README.md       # Detailed documentation
├── prisma/
│   ├── schema.prisma   # Prisma schema
│   └── seed.ts         # Seed script
├── lib/
│   └── db.ts           # Direct PostgreSQL client (pg)
└── .env.example        # Environment variables template
```

---

## Connection Options

You have TWO ways to connect to the database:

### 1. Prisma ORM (Recommended)
```typescript
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();
const workspaces = await prisma.workspace.findMany();
```

### 2. Direct PostgreSQL (pg)
```typescript
import { db } from '@/lib/db';

const workspaces = await db.getWorkspaces();
```

Both methods work! Prisma is recommended for type safety and ease of use.

---

## Troubleshooting

### Connection Refused
```bash
# Check if PostgreSQL is running
brew services list  # macOS
sudo systemctl status postgresql  # Linux
```

### Password Issues
```bash
# Reset password
psql -U postgres -c "ALTER USER yuhangbin WITH PASSWORD 'new_password';"
```

### Port Already in Use
Change port in `.env.local`:
```
DATABASE_URL="postgresql://writer_user:password@localhost:5433/writer_db"
```
