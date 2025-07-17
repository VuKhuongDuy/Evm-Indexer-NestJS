# Database Initialization Guide

This document explains how database initialization works in the EVM Indexer project.

## Overview

The database initialization process ensures that:
1. The PostgreSQL database is properly set up
2. Required tables are created
3. Default configuration values are inserted
4. The application can start successfully

## Initialization Methods

### 1. Docker Compose (Recommended)

When you run `docker-compose up`, the following happens automatically:

1. **PostgreSQL Container**: Starts with the `init-db.sql` script
2. **Application Container**: Waits for database readiness, then initializes if needed

```bash
# Start everything with database initialization
docker-compose up -d

# View logs to see initialization progress
docker-compose logs -f
```

### 2. Manual Initialization

You can manually initialize the database using the CLI command:

```bash
# Development mode
npm run cli init-db

# Or using the compiled version
npm run build
node dist/cli.js init-db
```

### 3. SQL Script Only

The `scripts/init-db.sql` script runs automatically when PostgreSQL starts for the first time:

```sql
-- Creates config table
-- Inserts default configuration values
-- Sets up indexes for performance
```

## Configuration Values

The following default configuration values are inserted during initialization:

| Key | Value | Description |
|-----|-------|-------------|
| `fromBlock` | `0` | Starting block for indexing |
| `lastProcessedBlock` | `0` | Last processed block |
| `indexerStatus` | `stopped` | Current indexer status |
| `createdAt` | `NOW()` | Creation timestamp |
| `database_initialized` | `NOW()` | Initialization timestamp |

## Environment Variables

Configure database initialization with these environment variables:

```bash
# Database connection
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=evm_indexer

# TypeORM settings
DATABASE_SYNCHRONIZE=true
DATABASE_LOGGING=false
DATABASE_MIGRATIONS=
DATABASE_MIGRATIONS_RUN=false
```

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps

# View PostgreSQL logs
docker-compose logs postgres

# Test database connection
docker exec evm-indexer-postgres pg_isready -U postgres -d evm_indexer
```

### Reset Database

```bash
# Stop containers and remove volumes
docker-compose down -v

# Start fresh
docker-compose up -d
```

### Manual Database Reset

```bash
# Connect to database
docker exec -it evm-indexer-postgres psql -U postgres -d evm_indexer

# Clear all data
TRUNCATE TABLE config;

# Exit
\q
```

## Development Workflow

1. **First Time Setup**:
   ```bash
   docker-compose up -d
   # Database will be initialized automatically
   ```

2. **Reset Database**:
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

3. **Manual Initialization**:
   ```bash
   npm run cli init-db
   ```

## Production Considerations

For production deployments:

1. **Disable Auto-Synchronize**: Set `DATABASE_SYNCHRONIZE=false`
2. **Use Migrations**: Enable `DATABASE_MIGRATIONS_RUN=true`
3. **Pre-initialize Database**: Run initialization scripts before deployment
4. **Backup Strategy**: Implement regular database backups
5. **Monitoring**: Add database health checks and monitoring

## Files Structure

```
├── scripts/
│   ├── init-db.sql          # PostgreSQL initialization script
│   └── start.sh             # Application startup script
├── src/
│   └── database/
│       ├── database.module.ts      # Database module
│       ├── database.service.ts     # Database service
│       ├── database-init.command.ts # Initialization command
│       └── entities/
│           └── config.entity.ts    # Config entity
├── docker-compose.yml       # Docker services
└── Dockerfile              # Application container
``` 