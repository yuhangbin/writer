#!/bin/bash

# Production startup script for Writer application
set -e

echo "Starting Writer application..."

# Load environment variables
if [ -f .env.production ]; then
  export $(cat .env.production | grep -v '^#' | xargs)
fi

# Build the application if needed
if [ ! -d ".next" ] || [ "src/app" -nt ".next" ]; then
  echo "Building application..."
  npm run build
fi

# Start the production server
echo "Starting server on port ${PORT:-3000}..."
npm start
