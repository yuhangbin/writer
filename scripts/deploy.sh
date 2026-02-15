#!/bin/bash
set -e

# ============================================
# Colors for output
# ============================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# ============================================
# Load Deployment Configuration
# ============================================
# Try to load .deploy.env if it exists
if [ -f .deploy.env ]; then
    log_info "Loading configuration from .deploy.env..."
    set -a
    source .deploy.env
    set +a
fi

# ============================================
# Deployment Configuration
# ============================================
SERVER_USER="${SERVER_USER:-}"
SERVER_HOST="${SERVER_HOST:-}"
SERVER_PATH="${SERVER_PATH:-/var/www/writer}"

# ============================================
# Validation
# ============================================
if [ -z "$SERVER_USER" ] || [ -z "$SERVER_HOST" ]; then
    log_error "SERVER_USER and SERVER_HOST environment variables must be set"
    echo "Usage: SERVER_USER=username SERVER_HOST=hostname bash scripts/deploy.sh"
    exit 1
fi

# ============================================
# Pre-flight Checks
# ============================================
log_info "Starting deployment to ${SERVER_USER}@${SERVER_HOST}..."

# Check if SSH connection works
log_info "Testing SSH connection..."
if ! ssh -o ConnectTimeout=10 "${SERVER_USER}@${SERVER_HOST}" "echo 'SSH connection successful'"; then
    log_error "Cannot connect to server. Please check your SSH credentials."
    exit 1
fi

# ============================================
# Create Temporary Archive
# ============================================
log_info "Creating deployment archive..."
TEMP_ARCHIVE="/tmp/writer-deploy-$(date +%s).tar.gz"

tar -czf "$TEMP_ARCHIVE" \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='*.log' \
    --exclude='.env.production' \
    --exclude='coverage' \
    --exclude='.DS_Store' \
    .

log_info "Archive created: $TEMP_ARCHIVE"

# ============================================
# Upload Scripts to Server
# ============================================
log_info "Uploading deployment scripts to server..."
ssh "${SERVER_USER}@${SERVER_HOST}" "mkdir -p /tmp/writer-deploy"

scp scripts/server-setup.sh "${SERVER_USER}@${SERVER_HOST}:/tmp/writer-deploy/"
scp scripts/remote-deploy.sh "${SERVER_USER}@${SERVER_HOST}:/tmp/writer-deploy/"
scp ecosystem.config.js "${SERVER_USER}@${SERVER_HOST}:/tmp/writer-deploy/"
scp nginx.conf.template "${SERVER_USER}@${SERVER_HOST}:/tmp/writer-deploy/"
scp .env.production.template "${SERVER_USER}@${SERVER_HOST}:/tmp/writer-deploy/"

# ============================================
# Upload Project Archive
# ============================================
log_info "Uploading project files to server..."
scp "$TEMP_ARCHIVE" "${SERVER_USER}@${SERVER_HOST}:/tmp/writer-deploy/"

# ============================================
# Execute Remote Deployment
# ============================================
log_info "Executing remote deployment..."
ssh "${SERVER_USER}@${SERVER_HOST}" bash /tmp/writer-deploy/remote-deploy.sh

# ============================================
# Cleanup
# ============================================
log_info "Cleaning up temporary files..."
rm -f "$TEMP_ARCHIVE"
ssh "${SERVER_USER}@${SERVER_HOST}" "rm -f /tmp/writer-deploy/writer-deploy-*.tar.gz"

# ============================================
# Completion
# ============================================
log_info "Deployment completed successfully!"
log_info "Your application should now be running at http://${SERVER_HOST}"
