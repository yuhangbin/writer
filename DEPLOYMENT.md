# Deployment Guide

Simple PM2-based deployment for the Writer application.

## Prerequisites

- Node.js 18+ installed on server
- PM2 installed globally: `npm install -g pm2`
- Git (for cloning/pulling code)

## Deployment Steps

### 1. SSH to Server

```bash
ssh user@your-server
```

### 2. Navigate to Project Directory

```bash
cd /path/to/writer
```

Or clone the repository:

```bash
git clone https://github.com/yourusername/writer.git
cd writer
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Build the Application

```bash
npm run build
```

### 5. Configure Environment Variables

Create `.env.production` with required environment variables:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:password@localhost:5432/writer_db
# Add other required environment variables
```

### 6. Start with PM2

```bash
pm2 start ecosystem.config.js
```

### 7. Save PM2 Configuration

```bash
pm2 save
pm2 startup
```

Run the command output by `pm2 startup` to enable PM2 to start on system boot.

## PM2 Management Commands

```bash
# View status
pm2 status

# View logs
pm2 logs writer

# Restart application
pm2 restart writer

# Stop application
pm2 stop writer

# Monitor in real-time
pm2 monit
```

## Updating the Application

```bash
# Pull latest code
git pull

# Install dependencies
npm install

# Build
npm run build

# Restart PM2
pm2 restart writer
```

## Troubleshooting

### Application won't start

Check PM2 logs for errors:
```bash
pm2 logs writer --lines 50
```

### Port already in use

Check what's using port 3000:
```bash
lsof -i :3000
```

### Build errors

Ensure Node.js version is 18+:
```bash
node --version
```

Clean and rebuild:
```bash
rm -rf .next node_modules
npm install
npm run build
```
