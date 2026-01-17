# Smart Restaurant

A comprehensive restaurant management system with separate admin and customer interfaces.

## Quick Start

### Using Docker (Recommended)

The easiest way to run the entire application:

```bash
# Copy environment file
cp .env.docker.example .env

# Edit .env with your configurations
nano .env

# Start all services
docker-compose up --build
```

Access the applications:
- **Admin Frontend**: http://localhost:3001
- **Customer Frontend**: http://localhost:4000
- **Backend API**: http://localhost:3000

For detailed Docker instructions, see [DOCKER.md](DOCKER.md).

### Manual Setup

If you prefer to run services individually, see the setup instructions in each directory:
- [Backend Setup](backend/README.md)
- [Admin Frontend Setup](admin-frontend/README.md)
- [Customer Frontend Setup](customer-frontend/README.md)

## Project Structure

```
smart-restaurant/
├── backend/              # NestJS API server
├── admin-frontend/       # Next.js admin interface
├── customer-frontend/    # Next.js customer interface
├── docker-compose.yml    # Docker development setup
├── docker-compose.prod.yml # Docker production setup
└── DOCKER.md            # Detailed Docker documentation
```

## Features

- **Admin Portal**: Manage menu, orders, tables, and staff
- **Customer Portal**: Browse menu, place orders, track delivery
- **Real-time Updates**: WebSocket integration for live order updates
- **Database**: MySQL with TypeORM
- **Authentication**: JWT-based auth system
- **Email Notifications**: Order confirmations and updates

## Technologies

- **Backend**: NestJS, TypeORM, MySQL, Socket.IO
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **DevOps**: Docker, Docker Compose, Nginx

## Development

```bash
# Install dependencies
yarn install

# Run backend in development
yarn workspace backend start:dev

# Run admin frontend in development
yarn workspace admin-frontend dev

# Run customer frontend in development
yarn workspace customer-frontend dev
```

## Production Deployment

See [DOCKER.md](DOCKER.md) for production deployment instructions using Docker Compose with Nginx reverse proxy.

## License

MIT

