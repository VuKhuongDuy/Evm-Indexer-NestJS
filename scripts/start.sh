#!/bin/bash

# Startup script for EVM Indexer
set -e

echo "Starting EVM Indexer..."

# Wait for database to be ready
echo "Waiting for database to be ready..."
until pg_isready -h $DATABASE_HOST -p $DATABASE_PORT -U $DATABASE_USERNAME -d $DATABASE_NAME; do
  echo "Database is not ready yet. Waiting..."
  sleep 2
done

echo "Database is ready!"

# Initialize database if needed
echo "Checking if database needs initialization..."
if [ "$NODE_ENV" = "development" ]; then
  echo "Running in development mode - initializing database..."
  npm run cli init-db
else
  echo "Running in production mode - database should be pre-initialized"
fi

# Start the application
echo "Starting application..."
if [ "$NODE_ENV" = "development" ]; then
  npm run start:dev
else
  npm run start:prod
fi 