# Docker Setup Guide

This guide explains how to run the Smart Restaurant application using Docker.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

## Quick Start

1. **Copy the environment file:**
   ```bash
   cp .env.docker.example .env
   ```

2. **Update the `.env` file with your configurations:**
   - Set a strong `JWT_SECRET`
   - Configure email settings (if needed)
   - Adjust database credentials (optional)

3. **Build and start all services:**
   ```bash
   docker-compose up --build
   ```

4. **Access the applications:**
   - Admin Frontend: http://localhost:3001
   - Customer Frontend: http://localhost:4000
   - Backend API: http://localhost:3000
   - MySQL Database: localhost:3306

## Services

The Docker setup includes the following services:

- **db**: MySQL 8.0 database
- **backend**: NestJS API server (Node.js 20)
- **admin-frontend**: Next.js admin interface
- **customer-frontend**: Next.js customer interface

## Useful Commands

### Start services in detached mode
```bash
docker-compose up -d
```

### Stop all services
```bash
docker-compose down
```

### Stop and remove volumes (⚠️ this will delete all data)
```bash
docker-compose down -v
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f admin-frontend
docker-compose logs -f customer-frontend
docker-compose logs -f db
```

### Rebuild a specific service
```bash
docker-compose build backend
docker-compose build admin-frontend
docker-compose build customer-frontend
```

### Restart a specific service
```bash
docker-compose restart backend
docker-compose restart admin-frontend
docker-compose restart customer-frontend
```

### Execute commands in a running container
```bash
# Access backend shell
docker-compose exec backend sh

# Access database
docker-compose exec db mysql -u restaurant_user -p smart_restaurant
```

## Environment Variables

All environment variables are configured in the `.env` file. Key variables include:

### Database
- `DB_ROOT_PASSWORD`: MySQL root password
- `DB_NAME`: Database name
- `DB_USERNAME`: Database user
- `DB_PASSWORD`: Database password
- `DB_PORT`: Database port (default: 3306)

### Backend
- `BACKEND_PORT`: Backend API port (default: 3000)
- `JWT_SECRET`: Secret key for JWT tokens

### Frontends
- `ADMIN_FRONTEND_PORT`: Admin frontend port (default: 3001)
- `CUSTOMER_FRONTEND_PORT`: Customer frontend port (default: 4000)
- `NEXT_PUBLIC_API_URL`: Backend API URL for frontends
- `NEXT_PUBLIC_SOCKET_URL`: WebSocket URL for frontends

### Email (Optional)
- `EMAIL_HOST`: SMTP host
- `EMAIL_PORT`: SMTP port
- `EMAIL_USER`: SMTP username
- `EMAIL_PASSWORD`: SMTP password
- `EMAIL_FROM`: From email address

## Development vs Production

### Development
For development, you might want to use volume mounts for hot-reloading. The current setup is optimized for production with built applications.

### Production
Before deploying to production:

1. **Change all default passwords and secrets**
2. **Use strong JWT_SECRET**
3. **Configure proper email settings**
4. **Set up SSL/TLS certificates**
5. **Use environment-specific URLs**
6. **Set up proper backup for database volumes**

## Volumes

The setup uses Docker volumes for data persistence:

- `db_data`: MySQL database files
- `backend_uploads`: Uploaded files (images, documents, etc.)

## Network

All services communicate through a dedicated Docker network called `smart-restaurant-network`.

## Troubleshooting

### Database connection errors
- Ensure the database service is healthy: `docker-compose ps`
- Check database logs: `docker-compose logs db`
- Verify database credentials in `.env`

### Port conflicts
If ports 3000, 3001, 4000, or 3306 are already in use:
- Update the respective `*_PORT` variables in `.env`
- Restart services: `docker-compose down && docker-compose up`

### Build failures
- Clear Docker cache: `docker-compose build --no-cache`
- Remove all containers and images:
  ```bash
  docker-compose down
  docker system prune -a
  docker-compose up --build
  ```

### Out of disk space
- Remove unused Docker resources: `docker system prune -a --volumes`

## Health Checks

The database service includes health checks to ensure it's ready before the backend starts. You can check service health:

```bash
docker-compose ps
```

## Updating the Application

To update to a new version:

```bash
# Pull latest code
git pull

# Rebuild and restart services
docker-compose down
docker-compose up --build
```

## Database Migrations

To run database migrations or seed data:

```bash
# Access backend container
docker-compose exec backend sh

# Run migrations (if you have migration scripts)
cd backend
# Add your migration commands here
```

## Backup and Restore

### Backup Database
```bash
docker-compose exec db mysqldump -u root -p smart_restaurant > backup.sql
```

### Restore Database
```bash
docker-compose exec -T db mysql -u root -p smart_restaurant < backup.sql
```

## Support

For issues or questions, please check the main README.md or create an issue in the repository.
