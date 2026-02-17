# GitHub Actions Deployment Guide

This document explains how to set up automated deployment for the Writer app using GitHub Actions.

## Overview

The deployment workflow automatically deploys your Writer app to a VPS whenever you push to the `main` branch.

## Prerequisites

1. **VPS with Node.js 20+ installed**
2. **PM2** (recommended) or systemd for process management
3. **PostgreSQL database** (or your preferred database)
4. **SSH access** to your VPS

## Setup Steps

### 1. Configure GitHub Secrets

Go to your GitHub repository settings: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

Add the following secrets:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `SSH_HOST` | VPS hostname or IP | `your-vps.com` or `192.168.1.100` |
| `SSH_PORT` | SSH port (optional) | `22` (default) |
| `SSH_USERNAME` | SSH username | `root` or `ubuntu` |
| `SSH_PRIVATE_KEY` | Private SSH key | Your private key content |
| `DEPLOY_PATH` | Deployment path on VPS | `/var/www/writer` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@localhost:5432/writer` |
| `UNIFIED_API_BASE_URL` | AI API endpoint | `https://api.example.com` |
| `UNIFIED_API_KEY` | AI API key | `your-api-key-here` |

#### How to Generate SSH Key Pair

On your local machine:

```bash
# Generate new SSH key pair
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/github-deploy

# Copy public key to VPS
ssh-copy-id -i ~/.ssh/github-deploy.pub user@your-vps.com
```

Then copy the **private key** content (`~/.ssh/github-deploy`) to the `SSH_PRIVATE_KEY` secret.

### 2. Prepare Your VPS

SSH into your VPS and run:

```bash
# Install Node.js 20 (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally (recommended)
sudo npm install -g pm2

# Create deployment directory
sudo mkdir -p /var/www/writer
sudo chown $USER:$USER /var/www/writer
```

### 3. Test Deployment

Push to the `main` branch to trigger the deployment:

```bash
git push origin main
```

Go to the **Actions** tab in your GitHub repository to monitor the deployment.

## Deployment Flow

```
Push to main → Build Next.js → Create package → Upload to VPS → Deploy → Restart app
```

## Directory Structure on VPS

```
/var/www/writer/
├── releases/
│   ├── 20240217143000/     # Older release
│   └── 20240217144500/     # Latest release (current)
├── shared/
│   ├── .env                # Environment variables
│   ├── app.log             # Application logs
│   └── pidfile             # Process ID (if not using PM2)
└── current -> releases/20240217144500  # Symlink to current release
```

## Management Commands

### Check Application Status

```bash
# If using PM2
ssh user@your-vps.com
pm2 status
pm2 logs writer

# If using node directly
ssh user@your-vps.com
cat /var/www/writer/shared/app.log
```

### Manual Deployment

```bash
# SSH into VPS
ssh user@your-vps.com

# Stop current app
pm2 stop writer

# Switch to previous release
cd /var/www/writer/releases
ln -sfn ./20240217143000 /var/www/writer/current

# Restart app
pm2 restart writer
```

### View Logs

```bash
# PM2 logs
pm2 logs writer --lines 100

# Application logs
tail -f /var/www/writer/shared/app.log
```

## Troubleshooting

### Deployment Fails

1. Check GitHub Actions logs for the specific error
2. Verify all secrets are correctly configured
3. Ensure SSH access works from your local machine

### Application Won't Start

1. Check application logs: `pm2 logs writer` or `cat /var/www/writer/shared/app.log`
2. Verify `.env` file exists and contains correct values
3. Check database connectivity
4. Verify Node.js version: `node --version`

### Permission Errors

```bash
# Fix permissions on VPS
sudo chown -R $USER:$USER /var/www/writer
```

## Environment Variables

The application requires these environment variables:

- `NODE_ENV` - Set to `production`
- `DATABASE_URL` - PostgreSQL connection string
- `UNIFIED_API_BASE_URL` - AI API endpoint
- `UNIFIED_API_KEY` - AI API key

## Rollback

To rollback to a previous version:

```bash
ssh user@your-vps.com

# List available releases
ls -la /var/www/writer/releases/

# Switch to previous release
ln -sfn /var/www/writer/releases/[TIMESTAMP] /var/www/writer/current

# Restart application
pm2 restart writer
```

## Security Best Practices

1. **Never commit secrets** to the repository
2. **Use strong SSH keys** (ED25519 recommended)
3. **Restrict SSH access** to specific IPs if possible
4. **Keep dependencies updated**: `npm update`
5. **Enable firewall**: `ufw allow 22 && ufw allow 80 && ufw allow 443 && ufw enable`

## Monitoring

Consider setting up:

- **Uptime monitoring**: UptimeRobot, Pingdom
- **Error tracking**: Sentry
- **Log aggregation**: Logtail, Datadog
- **Performance monitoring**: New Relic, DataDog
