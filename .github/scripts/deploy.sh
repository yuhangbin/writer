#!/bin/bash

set -e

# Deployment script for Writer app
# This script runs on the VPS to deploy the application

# Configuration
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/writer}"
APP_NAME="writer"
RELEASE_TIMESTAMP=$(date +%Y%m%d%H%M%S)
RELEASE_PATH="$DEPLOY_PATH/releases/$RELEASE_TIMESTAMP"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create necessary directories
log_info "Creating directories..."
mkdir -p "$DEPLOY_PATH/releases"
mkdir -p "$DEPLOY_PATH/shared"

# Create release directory
log_info "Creating release directory: $RELEASE_PATH"
mkdir -p "$RELEASE_PATH"

# Extract deployment package if provided
if [ -f "/tmp/deploy.tar.gz" ]; then
    log_info "Extracting deployment package..."
    tar -xzf /tmp/deploy.tar.gz -C "$RELEASE_PATH"
    rm -f /tmp/deploy.tar.gz
else
    log_error "Deployment package not found at /tmp/deploy.tar.gz"
    exit 1
fi

# Create .env file in release directory
log_info "Creating .env file..."
cat > "$RELEASE_PATH/.env" << ENVEOF
NODE_ENV=production
DATABASE_URL=${DATABASE_URL}
UNIFIED_API_BASE_URL=${UNIFIED_API_BASE_URL}
UNIFIED_API_KEY=${UNIFIED_API_KEY}
ENVEOF

# Verify .env file was created
if [ ! -f "$RELEASE_PATH/.env" ]; then
    log_error "Failed to create .env file"
    exit 1
fi

# Stop current application
log_info "Stopping current application..."
if [ -f "$DEPLOY_PATH/shared/pidfile" ]; then
    PID=$(cat "$DEPLOY_PATH/shared/pidfile")
    if kill -0 "$PID" 2>/dev/null; then
        log_info "Stopping process $PID..."
        kill "$PID"
        sleep 2

        # Force kill if still running
        if kill -0 "$PID" 2>/dev/null; then
            log_warn "Force killing process $PID..."
            kill -9 "$PID" 2>/dev/null || true
        fi
    fi
fi

# Stop PM2 if exists
if command -v pm2 &> /dev/null; then
    log_info "Stopping PM2 process..."
    pm2 stop "$APP_NAME" 2>/dev/null || true
    pm2 delete "$APP_NAME" 2>/dev/null || true
fi

# Switch to new release
log_info "Switching to new release..."
ln -sfn "$RELEASE_PATH" "$DEPLOY_PATH/current"

# Start application
log_info "Starting application..."
cd "$DEPLOY_PATH/current"

# Try PM2 first, fall back to simple node process
if command -v pm2 &> /dev/null; then
    log_info "Starting with PM2..."
    pm2 start server.js --name "$APP_NAME" \
        --env production \
        --log "$DEPLOY_PATH/shared/pm2.log" \
        --error "$DEPLOY_PATH/shared/pm2-error.log" \
        --output "$DEPLOY_PATH/shared/pm2-out.log"

    # Save PM2 list
    pm2 save || true
else
    log_info "Starting with node..."
    nohup node server.js > "$DEPLOY_PATH/shared/app.log" 2>&1 &
    APP_PID=$!
    echo "$APP_PID" > "$DEPLOY_PATH/shared/pidfile"
    log_info "Started with PID: $APP_PID"
fi

# Health check
log_info "Performing health check..."
sleep 5

if command -v pm2 &> /dev/null; then
    if pm2 describe "$APP_NAME" &> /dev/null; then
        STATUS=$(pm2 jlist | jq -r ".[] | select(.name == \"$APP_NAME\") | .pm2_env.status")
        if [ "$STATUS" = "online" ]; then
            log_info "✓ Application is running (PM2)"
        else
            log_error "✗ Application failed to start (PM2 status: $STATUS)"
            pm2 logs "$APP_NAME" --lines 50 --nostream
            exit 1
        fi
    else
        log_error "✗ PM2 process not found"
        exit 1
    fi
else
    if [ -f "$DEPLOY_PATH/shared/pidfile" ]; then
        APP_PID=$(cat "$DEPLOY_PATH/shared/pidfile")
        if kill -0 "$APP_PID" 2>/dev/null; then
            log_info "✓ Application is running (PID: $APP_PID)"
        else
            log_error "✗ Application failed to start (PID: $APP_PID not running)"
            cat "$DEPLOY_PATH/shared/app.log"
            exit 1
        fi
    fi
fi

# Cleanup old releases (keep last 3)
log_info "Cleaning up old releases..."
cd "$DEPLOY_PATH/releases"
ls -t | tail -n +4 | xargs rm -rf 2>/dev/null || true

log_info "✓ Deployment completed successfully"
log_info "Release: $RELEASE_TIMESTAMP"
log_info "Current: $DEPLOY_PATH/current"
