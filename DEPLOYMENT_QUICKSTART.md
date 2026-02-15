# Deployment Quick Reference

## One-Line Deployment Command

```bash
SERVER_USER=your-user SERVER_HOST=your-server-ip bash scripts/deploy.sh
```

## Required Variables

- `SERVER_USER` - SSH username for server access
- `SERVER_HOST` - Server IP address or domain name

## Optional Variables (set before running deploy)

```bash
# Deployment directory on server (default: /var/www/writer)
SERVER_PATH=/var/www/writer

# Database configuration
DB_NAME=writer_db
DB_USER=writer_user
DB_PASSWORD=your_secure_password

# Domain for Nginx (leave empty for IP-based)
DOMAIN=yourdomain.com
```

## Post-Deployment Verification

SSH into server and run:

```bash
cd /var/www/writer
bash ../scripts/verify.sh
```

Or manually:

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs writer

# Test application
curl http://localhost:3000
```

## Common Commands

### Update Application
```bash
SERVER_USER=user SERVER_HOST=server bash scripts/deploy.sh
```

### Restart Application
```bash
ssh user@server
pm2 restart writer
```

### View Logs
```bash
ssh user@server
pm2 logs writer
```

### Run Migrations
```bash
ssh user@server
cd /var/www/writer
npx prisma migrate deploy
```

### Rollback
```bash
ssh user@server
cd /var
# List backups: ls -lt writer.bak.*
# Restore: sudo rm -rf writer && sudo cp -r writer.bak.TIMESTAMP writer
```

## Troubleshooting

### Application won't start
```bash
pm2 logs writer --lines 50
```

### Database errors
```bash
sudo -u postgres psql -d writer_db
```

### Nginx errors
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/writer-error.log
```

### Rebuild from scratch
```bash
ssh user@server
cd /var/www/writer
rm -rf .next node_modules
npm ci
npm run build
pm2 restart writer
```

## File Structure

```
/var/www/writer/              # Deployment directory
├── .env.production           # Production environment variables
├── ecosystem.config.js       # PM2 configuration
├── nginx.conf.template       # Nginx configuration template
├── .next/                    # Next.js build output
├── node_modules/            # Dependencies
├── prisma/                  # Database schema and migrations
└── ...                      # Application files

/etc/nginx/sites-available/writer  # Nginx site configuration
/etc/nginx/sites-enabled/writer    # Nginx site symlink

/var/log/writer/            # Application logs
├── pm2-error.log          # PM2 error logs
└── pm2-out.log            # PM2 output logs
```

## Architecture

```
Internet → Nginx (80/443) → Next.js (3000) → PostgreSQL (5432)
```

## Environment Variables

Edit `/var/www/writer/.env.production`:

```bash
DATABASE_URL=postgresql://writer_user:password@localhost:5432/writer_db
UNIFIED_API_BASE_URL=https://api.example.com/v1
UNIFIED_API_KEY=your_api_key_here
NEXT_PUBLIC_APP_URL=http://yourdomain.com
```

## SSL Setup (Optional)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```
