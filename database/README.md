# PostgreSQL Database Setup Guide

This guide walks you through setting up PostgreSQL for the Writer project.

## Prerequisites

- PostgreSQL 14+ installed on your system
- Access to create databases and users (superuser privileges)

## Installation

### macOS (Homebrew)
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
Download and install from: https://www.postgresql.org/download/windows/

## Quick Setup

### Option 1: Automated Setup

1. **Run the setup script as PostgreSQL superuser:**
   ```bash
   psql -U postgres -f database/setup.sql
   ```

2. **Change the default password:**
   ```bash
   psql -U postgres -c "ALTER USER writer_user WITH PASSWORD 'your_secure_password';"
   ```

3. **Load the database schema:**
   ```bash
   psql -U writer_user -d writer_db -f database/schema.sql
   ```

### Option 2: Manual Setup

1. **Create the database and user:**
   ```bash
   # Connect to PostgreSQL
   psql -U postgres

   # In psql, run:
   CREATE USER writer_user WITH ENCRYPTED PASSWORD 'your_secure_password';
   CREATE DATABASE writer_db OWNER writer_user;
   GRANT ALL PRIVILEGES ON DATABASE writer_db TO writer_user;
   \connect writer_db
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   \q
   ```

2. **Load the schema:**
   ```bash
   psql -U writer_user -d writer_db -f database/schema.sql
   ```

## Configure Environment

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Update .env.local with your credentials:**
   ```env
   DATABASE_URL="postgresql://writer_user:your_secure_password@localhost:5432/writer_db"
   ```

## Install Dependencies

```bash
npm install pg @types/pg
```

## Verify Setup

Test your database connection:

```bash
psql -U writer_user -d writer_db -h localhost -c "SELECT version();"
```

You should see PostgreSQL version information.

## Database Schema Overview

| Table | Description |
|-------|-------------|
| `workspaces` | User workspaces for organizing writing context |
| `articles` | Generated articles linked to workspaces |
| `app_settings` | Application-wide settings |
| `ai_models` | Reference table of available AI models |

## Useful PostgreSQL Commands

```bash
# Connect to the database
psql -U writer_user -d writer_db

# List all tables
\dt

# Describe a table
\d workspaces

# View all data in a table
SELECT * FROM workspaces;

# Count records
SELECT COUNT(*) FROM articles;

# Exit psql
\q
```

## Backup & Restore

### Backup
```bash
pg_dump -U writer_user -d writer_db > backup.sql
```

### Restore
```bash
psql -U writer_user -d writer_db < backup.sql
```

## Troubleshooting

### Connection Refused
```bash
# Check if PostgreSQL is running
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# Start PostgreSQL
brew services start postgresql@16  # macOS
sudo systemctl start postgresql  # Linux
```

### Authentication Failed
Ensure the password in `DATABASE_URL` matches what you set:
```bash
psql -U postgres -c "ALTER USER writer_user WITH PASSWORD 'new_password';"
```

### Port Already in Use
Default PostgreSQL port is 5432. If using a different port, update your `DATABASE_URL`:
```
postgresql://writer_user:password@localhost:5433/writer_db
```

## Security Best Practices

1. **Use strong passwords** - Never use default passwords in production
2. **Environment variables** - Store credentials in `.env.local`, never commit to git
3. **Limit connections** - Adjust `CONNECTION LIMIT` based on your needs
4. **Regular backups** - Set up automated backups
5. **SSL/TLS** - Enable SSL for production databases
6. **Least privilege** - The application user only needs access to `writer_db`

## Next Steps

After database setup, you'll need to:

1. Create a database access layer (DAL) in `/lib/db.ts`
2. Add migration scripts for schema changes
3. Set up connection pooling with `pg` or an ORM like Prisma/Drizzle
4. Implement API routes for data access
