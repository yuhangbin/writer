# Deployment Guide for Writer Application

This guide covers deploying the Writer application to a Linux server (Ubuntu/Debian) with PostgreSQL, Nginx, and PM2.

## Prerequisites

- **Local machine**: SSH client, bash shell
- **Server**: Ubuntu/Debian Linux with sudo privileges
- **Network**: SSH access to server (port 22), open HTTP (80) and HTTPS (443) ports

## Quick Start

### 1. Configure Deployment Variables

```bash
# Copy deployment environment template
cp .deploy.env.example .deploy.env

# Edit with your server details
nano .deploy.env
```

### 2. Run Deployment

```bash
# Option 1: Using npm script (recommended)
npm run deploy

# Option 2: Using bash script directly
bash scripts/deploy.sh

# Option 3: Override environment variables
SERVER_USER=username SERVER_HOST=192.168.1.100 bash scripts/deploy.sh
```

## What Gets Deployed

The deployment process automatically:

1. **Checks and installs dependencies** (Node.js 18+, PostgreSQL, PM2, Nginx)
2. **Creates PostgreSQL database** and user with proper permissions
3. **Uploads project files** (excluding node_modules, .next, .git)
4. **Installs npm dependencies** and runs database migrations
5. **Builds the Next.js application** for production
6. **Starts the application** with PM2 process manager
7. **Configures Nginx** reverse proxy to serve the app

## Deployment Scripts

### `scripts/deploy.sh` (Local)

Triggered from your local machine. This script:
- Creates a compressed archive of the project
- Uploads files via SCP to the server
- Executes remote deployment script via SSH

**Required environment variables:**
- `SERVER_USER` - SSH username
- `SERVER_HOST` - Server IP or domain

### `scripts/server-setup.sh` (Remote)

Runs on the server to check and install dependencies:
- Checks/installs Node.js (v18+)
- Checks/installs PostgreSQL
- Checks/installs PM2
- Checks/installs Nginx
- Creates database and user
- Sets up deployment directory

**Optional environment variables:**
- `SERVER_PATH` - Deployment directory (default: `/var/www/writer`)
- `DB_NAME` - Database name (default: `writer_db`)
- `DB_USER` - Database user (default: `writer_user`)
- `DB_PASSWORD` - Database password (default: `change_this_password`)

### `scripts/remote-deploy.sh` (Remote)

Runs on the server to deploy the application:
- Extracts project files
- Installs dependencies with `npm ci`
- Runs Prisma migrations
- Builds Next.js application
- Starts/restarts PM2 process
- Configures/reloads Nginx

## Configuration Files

### `ecosystem.config.js`

PM2 process manager configuration:
- App name: `writer`
- Script: `next start`
- Port: 3000 (internal)
- Logs: `/var/log/writer/`

### `nginx.conf.template`

Nginx reverse proxy configuration:
- Listens on port 80 (HTTP)
- Proxies to Next.js on port 3000
- Includes WebSocket support
- Gzip compression enabled
- Static file caching

### `.env.production.template`

Template for production environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `UNIFIED_API_BASE_URL` - AI provider API URL
- `UNIFIED_API_KEY` - AI provider API key
- `NEXT_PUBLIC_APP_URL` - Public app URL

## Post-Deployment

### 1. Update Environment Variables

SSH into the server and update the production environment:

```bash
ssh user@your-server
cd /var/www/writer
nano .env.production
```

Add your actual database password and API keys.

### 2. Restart Application

```bash
pm2 restart writer
```

### 3. Verify Deployment

Check PM2 process status:
```bash
pm2 status
```

Check application logs:
```bash
pm2 logs writer
```

Test application response:
```bash
curl http://localhost:3000
```

Check Nginx status:
```bash
sudo systemctl status nginx
```

## Monitoring and Management

### PM2 Commands

```bash
# List all processes
pm2 list

# Show process details
pm2 show writer

# View logs
pm2 logs writer

# Monitor in real-time
pm2 monit

# Restart application
pm2 restart writer

# Stop application
pm2 stop writer

# Delete process
pm2 delete writer

# Save process list for auto-start
pm2 save
```

### Nginx Commands

```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo nginx reload

# Restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/writer-error.log
```

### Database Commands

```bash
# Access PostgreSQL console
sudo -u postgres psql

# Connect to writer database
sudo -u postgres psql -d writer_db

# Run migrations
cd /var/www/writer
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Open Prisma Studio
npx prisma studio
```

## Updating the Application

To deploy updates:

```bash
# Option 1: Using npm script (recommended)
npm run deploy

# Option 2: Using bash script directly
bash scripts/deploy.sh
```

The deployment script will:
1. Create a backup of the current deployment
2. Upload and extract new files
3. Install dependencies
4. Run database migrations
5. Rebuild the application
6. Restart PM2 process
7. Keep last 3 backups automatically

## Rollback

If something goes wrong:

```bash
ssh user@your-server
cd /var/www

# List backups
ls -lt writer.bak.*

# Restore backup (replace with actual backup path)
sudo rm -rf writer
sudo cp -r writer.bak.1234567890 writer
sudo chown -R your-user:your-user writer

# Restart PM2
pm2 restart writer
```

## SSL/HTTPS (Optional)

To enable HTTPS with Let's Encrypt:

```bash
# Install Certbot on server
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal is configured automatically
```

Update `nginx.conf.template` to include SSL configuration before deploying.

## Troubleshooting

### Application won't start

Check PM2 logs:
```bash
pm2 logs writer --lines 50
```

Common issues:
- Missing environment variables in `.env.production`
- Database connection failed (check `DATABASE_URL`)
- Port 3000 already in use

### Database connection errors

Verify database exists:
```bash
sudo -u postgres psql -l | grep writer_db
```

Test connection:
```bash
psql -h localhost -U writer_user -d writer_db
```

Check `.env.production` `DATABASE_URL` format.

### Nginx 502 Bad Gateway

Check if Next.js is running:
```bash
pm2 status
curl http://localhost:3000
```

Verify Nginx configuration:
```bash
sudo nginx -t
```

### Build errors

Check Node.js version:
```bash
node --version  # Should be v18+
```

Clean and rebuild:
```bash
cd /var/www/writer
rm -rf .next node_modules
npm ci
npm run build
pm2 restart writer
```

## Security Recommendations

1. **Change default passwords** - Update database password in `.env.production`
2. **Configure firewall** - Use ufw to allow only necessary ports
3. **Enable SSL** - Use Certbot for HTTPS
4. **Regular updates** - Keep packages updated with `apt-get update && apt-get upgrade`
5. **Limit SSH access** - Use key-based authentication
6. **Monitor logs** - Regularly check application and Nginx logs

## Architecture Diagram

```
┌─────────────┐
│   Browser  │
└──────┬──────┘
       │ HTTP/HTTPS
       ▼
┌─────────────────┐
│  Nginx (Port 80) │  ← Reverse Proxy
└────────┬────────┘
         │
         ▼
┌──────────────────┐
│  Next.js (Port 3000)  │  ← Managed by PM2
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   PostgreSQL     │  ← Database
│   (Port 5432)    │
└──────────────────┘
```

## Support

For issues or questions:
1. Check PM2 logs: `pm2 logs writer`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/writer-error.log`
3. Review deployment script output
4. Verify all prerequisites are met
