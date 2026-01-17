.PHONY: help build up down restart logs clean

# Default target
help:
	@echo "Smart Restaurant Docker Commands"
	@echo "================================="
	@echo "make build        - Build all Docker images"
	@echo "make up           - Start all services"
	@echo "make down         - Stop all services"
	@echo "make restart      - Restart all services"
	@echo "make logs         - View logs from all services"
	@echo "make clean        - Stop services and remove volumes (⚠️  deletes data)"
	@echo ""
	@echo "Development Commands:"
	@echo "make dev          - Start services in development mode"
	@echo "make dev-logs     - View development logs"
	@echo ""
	@echo "Production Commands:"
	@echo "make prod-build   - Build for production"
	@echo "make prod-up      - Start production services"
	@echo "make prod-down    - Stop production services"
	@echo "make prod-logs    - View production logs"
	@echo ""
	@echo "Service-specific Commands:"
	@echo "make backend-logs      - View backend logs"
	@echo "make admin-logs        - View admin frontend logs"
	@echo "make customer-logs     - View customer frontend logs"
	@echo "make db-logs           - View database logs"
	@echo ""
	@echo "Database Commands:"
	@echo "make db-shell          - Access MySQL shell"
	@echo "make db-backup         - Backup database"
	@echo "make db-restore FILE=backup.sql - Restore database from file"

# Development
build:
	docker-compose build

up:
	docker-compose up

dev:
	docker-compose up -d

dev-logs:
	docker-compose logs -f

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

# Production
prod-build:
	docker-compose -f docker-compose.prod.yml build

prod-up:
	docker-compose -f docker-compose.prod.yml up -d

prod-down:
	docker-compose -f docker-compose.prod.yml down

prod-logs:
	docker-compose -f docker-compose.prod.yml logs -f

# Service-specific logs
backend-logs:
	docker-compose logs -f backend

admin-logs:
	docker-compose logs -f admin-frontend

customer-logs:
	docker-compose logs -f customer-frontend

db-logs:
	docker-compose logs -f db

# Database operations
db-shell:
	docker-compose exec db mysql -u root -p

db-backup:
	@echo "Creating database backup..."
	@docker-compose exec -T db mysqldump -u root -p$$(grep DB_ROOT_PASSWORD .env | cut -d '=' -f2) smart_restaurant > backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Backup completed!"

db-restore:
	@if [ -z "$(FILE)" ]; then \
		echo "Usage: make db-restore FILE=backup.sql"; \
		exit 1; \
	fi
	@echo "Restoring database from $(FILE)..."
	@docker-compose exec -T db mysql -u root -p$$(grep DB_ROOT_PASSWORD .env | cut -d '=' -f2) smart_restaurant < $(FILE)
	@echo "Restore completed!"

# Cleanup
clean:
	@echo "⚠️  This will remove all containers, networks, and volumes!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		echo "Cleanup completed!"; \
	else \
		echo "Cleanup cancelled."; \
	fi

# System cleanup
system-clean:
	@echo "⚠️  This will remove all unused Docker resources!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker system prune -a --volumes; \
		echo "System cleanup completed!"; \
	else \
		echo "Cleanup cancelled."; \
	fi
