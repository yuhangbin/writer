#!/bin/bash
set -e

# ============================================
# Configuration
# ============================================
SERVER_PATH="${SERVER_PATH:-/var/www/writer}"
DOMAIN="${DOMAIN:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# Helper Functions
# ============================================
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# ============================================
# Pre-flight Checks
# ============================================
log_step "Running pre-flight checks..."

# Check Node.js
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed. Running server setup..."
    bash /tmp/writer-deploy/server-setup.sh
else
    log_info "Node.js $(node -v) found"
fi

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    log_error "PostgreSQL is not installed. Running server setup..."
    bash /tmp/writer-deploy/server-setup.sh
else
    log_info "PostgreSQL $(psql --version | awk '{print $3}') found"
fi

# Check PM2
if ! command -v pm2 &> /dev/null; then
    log_error "PM2 is not installed. Running server setup..."
    bash /tmp/writer-deploy/server-setup.sh
else
    log_info "PM2 $(pm2 -v) found"
fi

# Check Nginx
if ! command -v nginx &> /dev/null; then
    log_error "Nginx is not installed. Running server setup..."
    bash /tmp/writer-deploy/server-setup.sh
else
    log_info "Nginx found"
fi

# ============================================
# Extract Project Files
# ============================================
log_step "Extracting project files..."

ARCHIVE=$(ls /tmp/writer-deploy/writer-deploy-*.tar.gz 2>/dev/null | head -n 1)

if [ -z "$ARCHIVE" ]; then
    log_error "No deployment archive found in /tmp/writer-deploy/"
    exit 1
fi

# Backup existing deployment if it exists
if [ -d "$SERVER_PATH" ] && [ "$(ls -A $SERVER_PATH 2>/dev/null)" ]; then
    log_info "Backing up existing deployment..."
    BACKUP_PATH="${SERVER_PATH}.bak.$(date +%s)"
    sudo cp -r "$SERVER_PATH" "$BACKUP_PATH"
    log_info "Backup created at: $BACKUP_PATH"
fi

# Extract archive
log_info "Extracting $ARCHIVE to $SERVER_PATH..."
sudo mkdir -p "$SERVER_PATH"
sudo tar -xzf "$ARCHIVE" -C "$SERVER_PATH"
sudo chown -R $USER:$USER "$SERVER_PATH"

# Copy configuration files to deployment directory
cp /tmp/writer-deploy/ecosystem.config.js "$SERVER_PATH/"
cp /tmp/writer-deploy/nginx.conf.template "$SERVER_PATH/"

# Ensure .env.production exists
if [ ! -f "$SERVER_PATH/.env.production" ]; then
    if [ -f "/tmp/writer-deploy/.env.production.template" ]; then
        cp /tmp/writer-deploy/.env.production.template "$SERVER_PATH/.env.production"
    fi
fi

cd "$SERVER_PATH"

# ============================================
# Install Dependencies
# ============================================
log_step "Installing npm dependencies..."
npm ci --production=false

# ============================================
# Database Migrations
# ============================================
log_step "Running database migrations..."
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# ============================================
# Build Application
# ============================================
log_step "Building Next.js application..."
npm run build

# ============================================
# PM2 Process Management
# ============================================
log_step "Starting application with PM2..."

# Check if process is already running
if pm2 list | grep -q "writer"; then
    log_info "Stopping existing PM2 process..."
    pm2 stop writer || true
    pm2 delete writer || true
fi

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Configure PM2 to start on system boot
pm2 startup systemd -hp /home/$USER --user $USER || log_warn "Could not configure PM2 startup (may need manual setup)"

# ============================================
# Configure Nginx
# ============================================
log_step "Configuring Nginx..."

NGINX_SITE_AVAILABLE="/etc/nginx/sites-available/writer"
NGINX_SITE_ENABLED="/etc/nginx/sites-enabled/writer"

# Generate nginx configuration from template
if [ -f "$SERVER_PATH/nginx.conf.template" ]; then
    if [ -n "$DOMAIN" ]; then
        # Use domain-specific configuration
        sed "s|\${SERVER_PATH}|$SERVER_PATH|g; s|\${DOMAIN}|$DOMAIN|g" \
            "$SERVER_PATH/nginx.conf.template" | sudo tee "$NGINX_SITE_AVAILABLE" > /dev/null
    else
        # Use IP-based configuration
        SERVER_IP=$(hostname -I | awk '{print $1}')
        sed "s|\${SERVER_PATH}|$SERVER_PATH|g; s|\${DOMAIN}|$SERVER_IP|g" \
            "$SERVER_PATH/nginx.conf.template" | sudo tee "$NGINX_SITE_AVAILABLE" > /dev/null
    fi

    # Enable site
    if [ ! -L "$NGINX_SITE_ENABLED" ]; then
        sudo ln -sf "$NGINX_SITE_AVAILABLE" "$NGINX_SITE_ENABLED"
    fi

    # Test Nginx configuration
    if sudo nginx -t; then
        log_info "Nginx configuration is valid"
        sudo systemctl reload nginx
        log_info "Nginx reloaded successfully"
    else
        log_error "Nginx configuration test failed"
        exit 1
    fi
else
    log_warn "No nginx.conf.template found, skipping Nginx configuration"
fi

# ============================================
# Health Check
# ============================================
log_step "Performing health check..."

sleep 5

# Check PM2 process status
if pm2 list | grep "writer" | grep -q "online"; then
    log_info "PM2 process is running"
else
    log_error "PM2 process failed to start"
    pm2 logs writer --lines 20
    exit 1
fi

# Check application response
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    log_info "Application is responding on port 3000"
else
    log_warn "Application health check failed (may still be starting up)"
fi

# ============================================
# Cleanup Old Backups
# ============================================
log_step "Cleaning up old backups (keeping last 3)..."

if [ -d "${SERVER_PATH}.bak."* ]; then
    ls -td ${SERVER_PATH}.bak.* | tail -n +4 | xargs -r sudo rm -rf
    log_info "Old backups cleaned up"
fi

# ============================================
# Deployment Summary
# ============================================
log_info "Deployment completed successfully!"
log_info ""
log_info "Application Status:"
pm2 list | grep "writer"
log_info ""
log_info "View logs: pm2 logs writer"
log_info "Monitor: pm2 monit"
log_info "Restart: pm2 restart writer"
log_info "Stop: pm2 stop writer"
