# EVM Indexer Setup Guide

## Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- npm or yarn

## Quick Start

### 1. Install Dependencies

```bash
# Clean install to resolve dependency conflicts
rm -rf node_modules package-lock.json
npm install
```

### 2. Start PostgreSQL Database

```bash
# Start the database and pgAdmin
docker-compose up -d

# Verify containers are running
docker-compose ps
```

### 3. Environment Configuration

```bash
# Copy the example environment file
cp env.example .env

# Edit .env with your specific values
# At minimum, update RPC_URL with your Ethereum RPC endpoint
```

### 4. Run the Application

```bash
# Development mode
npm run start:dev

# Or production build
npm run build
npm run start:prod
```

## Database Access

- **PostgreSQL**: `localhost:5432`
  - Database: `evm_indexer`
  - Username: `postgres`
  - Password: `postgres`

- **pgAdmin**: `http://localhost:8080`
  - Email: `admin@evm-indexer.com`
  - Password: `admin`

## Troubleshooting

### Dependency Conflicts

If you encounter dependency conflicts:

1. **Clean install** (recommended):
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Force install** (use with caution):
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Update all NestJS packages**:
   ```bash
   npm update @nestjs/common @nestjs/core @nestjs/platform-express @nestjs/config @nestjs/typeorm @nestjs/swagger
   ```

### Database Connection Issues

1. **Check if PostgreSQL is running**:
   ```bash
   docker-compose ps
   ```

2. **View logs**:
   ```bash
   docker-compose logs postgres
   ```

3. **Reset database**:
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

### Port Conflicts

If ports 5432 or 8080 are already in use:

1. **Stop existing services**:
   ```bash
   # Find what's using the port
   lsof -i :5432
   lsof -i :8080
   
   # Stop the service or change ports in docker-compose.yml
   ```

2. **Modify docker-compose.yml** to use different ports:
   ```yaml
   ports:
     - "5433:5432"  # Use 5433 instead of 5432
   ```

## Development Workflow

1. **Start database**: `docker-compose up -d`
2. **Start application**: `npm run start:dev`
3. **Access API**: `http://localhost:3000/api`
4. **Access Swagger**: `http://localhost:3000/api`
5. **Access pgAdmin**: `http://localhost:8080`

## Production Deployment

For production, consider:

1. **Environment variables**: Use proper secrets management
2. **Database**: Use managed PostgreSQL service
3. **Security**: Change default passwords
4. **Monitoring**: Add health checks and logging
5. **SSL**: Enable SSL for database connections

## Long-term Maintenance

### Regular Updates

1. **Update dependencies monthly**:
   ```bash
   npm audit
   npm update
   ```

2. **Check for breaking changes**:
   ```bash
   npm outdated
   ```

3. **Update Docker images**:
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

### Backup Strategy

1. **Database backups**:
   ```bash
   docker exec evm-indexer-postgres pg_dump -U postgres evm_indexer > backup.sql
   ```

2. **Volume backups**:
   ```bash
   docker run --rm -v evm-indexer_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .
   ``` 