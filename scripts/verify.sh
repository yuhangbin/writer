#!/bin/bash
# ============================================
# Deployment Verification Script
# ============================================
# Run this on the server after deployment to verify everything is working

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASS=0
FAIL=0
WARN=0

# Helper functions
log_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS++))
}

log_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL++))
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARN++))
}

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

echo "=========================================="
echo "Deployment Verification"
echo "=========================================="
echo ""

# ============================================
# Check Server Dependencies
# ============================================
echo "1. Checking server dependencies..."

# Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -ge 18 ]; then
        log_pass "Node.js: $NODE_VERSION (>= 18)"
    else
        log_fail "Node.js: $NODE_VERSION (need >= 18)"
    fi
else
    log_fail "Node.js not found"
fi

# npm
if command -v npm &> /dev/null; then
    log_pass "npm: $(npm -v)"
else
    log_fail "npm not found"
fi

# PostgreSQL
if command -v psql &> /dev/null; then
    log_pass "PostgreSQL: $(psql --version | awk '{print $3}')"
else
    log_fail "PostgreSQL not found"
fi

# PM2
if command -v pm2 &> /dev/null; then
    log_pass "PM2: $(pm2 -v)"
else
    log_fail "PM2 not found"
fi

# Nginx
if command -v nginx &> /dev/null; then
    log_pass "Nginx: $(nginx -v 2>&1 | grep -oP 'nginx/\K[0-9.]+')"
else
    log_fail "Nginx not found"
fi

echo ""

# ============================================
# Check Database
# ============================================
echo "2. Checking database configuration..."

DB_NAME="${DB_NAME:-writer_db}"

if sudo -u postgres psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    log_pass "Database '$DB_NAME' exists"

    # Check database connections
    CONNECTIONS=$(sudo -u postgres psql -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname='$DB_NAME'" 2>/dev/null | xargs)
    log_info "Active database connections: $CONNECTIONS"
else
    log_fail "Database '$DB_NAME' not found"
fi

echo ""

# ============================================
# Check PM2 Process
# ============================================
echo "3. Checking PM2 process status..."

if pm2 list | grep -q "writer"; then
    PROCESS_STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="writer") | .pm2_env.status' 2>/dev/null)

    if [ "$PROCESS_STATUS" = "online" ]; then
        log_pass "PM2 process 'writer' is online"

        # Get CPU and memory usage
        CPU=$(pm2 jlist | jq -r '.[] | select(.name=="writer") | .monit.cpu' 2>/dev/null)
        MEMORY=$(pm2 jlist | jq -r '.[] | select(.name=="writer") | .monit.memory' 2>/dev/null)

        if [ -n "$CPU" ]; then
            log_info "CPU usage: ${CPU}%"
        fi

        if [ -n "$MEMORY" ]; then
            MEMORY_MB=$((MEMORY / 1024 / 1024))
            log_info "Memory usage: ${MEMORY_MB}MB"
        fi
    else
        log_fail "PM2 process 'writer' status: $PROCESS_STATUS"
    fi
else
    log_fail "PM2 process 'writer' not found"
fi

echo ""

# ============================================
# Check Application Response
# ============================================
echo "4. Checking application response..."

if curl -f -s http://localhost:3000 > /dev/null 2>&1; then
    log_pass "Application responding on port 3000"

    # Get HTTP status code
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
    log_info "HTTP status code: $STATUS"
else
    log_fail "Application not responding on port 3000"
fi

echo ""

# ============================================
# Check Nginx Configuration
# ============================================
echo "5. Checking Nginx configuration..."

if sudo nginx -t 2>&1 | grep -q "successful"; then
    log_pass "Nginx configuration is valid"
else
    log_fail "Nginx configuration has errors"
fi

if sudo systemctl is-active --quiet nginx; then
    log_pass "Nginx service is active"
else
    log_fail "Nginx service is not active"
fi

# Check if writer site is enabled
if [ -L "/etc/nginx/sites-enabled/writer" ]; then
    log_pass "Nginx site 'writer' is enabled"
else
    log_warn "Nginx site 'writer' is not enabled"
fi

echo ""

# ============================================
# Check File Permissions
# ============================================
echo "6. Checking file permissions..."

SERVER_PATH="${SERVER_PATH:-/var/www/writer}"

if [ -d "$SERVER_PATH" ]; then
    log_pass "Deployment directory exists: $SERVER_PATH"

    # Check .env.production
    if [ -f "$SERVER_PATH/.env.production" ]; then
        log_pass "Environment file exists"

        # Check if DATABASE_URL is set
        if grep -q "DATABASE_URL=" "$SERVER_PATH/.env.production"; then
            log_pass "DATABASE_URL is configured"
        else
            log_fail "DATABASE_URL is not set in .env.production"
        fi
    else
        log_fail "Environment file not found: .env.production"
    fi

    # Check ecosystem.config.js
    if [ -f "$SERVER_PATH/ecosystem.config.js" ]; then
        log_pass "PM2 ecosystem config exists"
    else
        log_fail "PM2 ecosystem config not found"
    fi
else
    log_fail "Deployment directory not found: $SERVER_PATH"
fi

echo ""

# ============================================
# Check Log Files
# ============================================
echo "7. Checking log files..."

LOG_DIR="/var/log/writer"

if [ -d "$LOG_DIR" ]; then
    log_pass "Log directory exists: $LOG_DIR"

    # Check if log files are being written
    if [ -f "$LOG_DIR/pm2-error.log" ]; then
        ERROR_COUNT=$(sudo wc -l < "$LOG_DIR/pm2-error.log" 2>/dev/null | xargs)
        log_info "PM2 error log entries: $ERROR_COUNT"

        # Check for recent errors (last 10 lines)
        if tail -10 "$LOG_DIR/pm2-error.log" 2>/dev/null | grep -qi "error"; then
            log_warn "Recent errors found in PM2 error log"
        fi
    fi

    if [ -f "$LOG_DIR/pm2-out.log" ]; then
        log_pass "PM2 output log exists"
    fi
else
    log_warn "Log directory not found: $LOG_DIR"
fi

echo ""

# ============================================
# Summary
# ============================================
echo "=========================================="
echo "Verification Summary"
echo "=========================================="
echo -e "${GREEN}Passed:${NC} $PASS"
echo -e "${RED}Failed:${NC} $FAIL"
echo -e "${YELLOW}Warnings:${NC} $WARN"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}"
    echo ""
    echo "Your application is deployed and running."
    echo ""
    echo "Next steps:"
    echo "  - Configure SSL/HTTPS if needed"
    echo "  - Update .env.production with actual API keys"
    echo "  - Set up monitoring and alerts"
    echo "  - Review security settings"
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please review the output above.${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  - Check PM2 logs: pm2 logs writer"
    echo "  - Check Nginx logs: sudo tail -f /var/log/nginx/writer-error.log"
    echo "  - Restart PM2: pm2 restart writer"
    exit 1
fi
