#!/bin/bash
set -e

# ============================================
# Configuration
# ============================================
SERVER_PATH="${SERVER_PATH:-/var/www/writer}"
DB_NAME="${DB_NAME:-writer_db}"
DB_USER="${DB_USER:-writer_user}"
DB_PASSWORD="${DB_PASSWORD:-change_this_password}"

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

check_command() {
    if command -v "$1" &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# ============================================
# Update Package Lists
# ============================================
log_step "Updating package lists..."
sudo apt-get update -qq

# ============================================
# Check and Install Node.js
# ============================================
log_step "Checking Node.js installation..."

if check_command node; then
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    log_info "Node.js is installed (version: $(node -v))"

    if [ "$NODE_VERSION" -lt 18 ]; then
        log_warn "Node.js version is less than 18. Upgrading..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
else
    log_info "Node.js not found. Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

log_info "Node.js version: $(node -v)"
log_info "npm version: $(npm -v)"

# ============================================
# Check and Install PostgreSQL
# ============================================
log_step "Checking PostgreSQL installation..."

if check_command psql; then
    log_info "PostgreSQL is installed (version: $(psql --version))"
else
    log_info "PostgreSQL not found. Installing..."
    sudo apt-get install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# ============================================
# Setup PostgreSQL Database
# ============================================
log_step "Setting up PostgreSQL database..."

# Check if database exists
DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "0")

if [ "$DB_EXISTS" = "1" ]; then
    log_info "Database '$DB_NAME' already exists"
else
    log_info "Creating database '$DB_NAME'..."
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"
fi

# Check if user exists
USER_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_user WHERE usename='$DB_USER'" 2>/dev/null || echo "0")

if [ "$USER_EXISTS" = "1" ]; then
    log_info "Database user '$DB_USER' already exists"
    # Update password
    sudo -u postgres psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
else
    log_info "Creating database user '$DB_USER'..."
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
fi

# ============================================
# Install PM2
# ============================================
log_step "Checking PM2 installation..."

if check_command pm2; then
    log_info "PM2 is installed (version: $(pm2 -v))"
else
    log_info "PM2 not found. Installing globally..."
    sudo npm install -g pm2
fi

# ============================================
# Check and Install Nginx
# ============================================
log_step "Checking Nginx installation..."

if check_command nginx; then
    log_info "Nginx is installed (version: $(nginx -v 2>&1))"
else
    log_info "Nginx not found. Installing..."
    sudo apt-get install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
fi

# ============================================
# Create Deployment Directory
# ============================================
log_step "Setting up deployment directory..."

if [ ! -d "$SERVER_PATH" ]; then
    sudo mkdir -p "$SERVER_PATH"
    sudo chown $USER:$USER "$SERVER_PATH"
    log_info "Created deployment directory: $SERVER_PATH"
else
    log_info "Deployment directory exists: $SERVER_PATH"
fi

# Create log directory
sudo mkdir -p /var/log/writer
sudo chown $USER:$USER /var/log/writer

# ============================================
# Setup Environment File
# ============================================
log_step "Setting up environment file..."

ENV_FILE="$SERVER_PATH/.env.production"

if [ ! -f "$ENV_FILE" ]; then
    if [ -f "/tmp/writer-deploy/.env.production.template" ]; then
        cp /tmp/writer-deploy/.env.production.template "$ENV_FILE"

        # Update with actual database credentials
        sed -i "s/writer_db/$DB_NAME/g" "$ENV_FILE"
        sed -i "s/writer_user/$DB_USER/g" "$ENV_FILE"
        sed -i "s/change_this_password/$DB_PASSWORD/g" "$ENV_FILE"

        log_info "Created .env.production from template"
        log_warn "Please review and update $ENV_FILE with your actual configuration"
    else
        log_warn "No .env.production.template found, creating minimal .env.production"
        cat > "$ENV_FILE" << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
EOF
    fi
else
    log_info ".env.production already exists"
fi

# ============================================
# Completion
# ============================================
log_info "Server setup completed successfully!"
log_info ""
log_info "Summary:"
log_info "  - Node.js: $(node -v)"
log_info "  - PostgreSQL: $(psql --version)"
log_info "  - PM2: $(pm2 -v)"
log_info "  - Nginx: $(nginx -v 2>&1)"
log_info "  - Database: $DB_NAME"
log_info "  - Deployment path: $SERVER_PATH"
