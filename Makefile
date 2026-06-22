.PHONY: build up down logs restart test lint format backend-shell frontend-shell clean

# Default target
.DEFAULT_GOAL := help

help:
	@echo "HazardMap - Available Commands"
	@echo ""
	@echo "  make build          Build and start all containers"
	@echo "  make up             Start containers (no rebuild)"
	@echo "  make down           Stop all containers"
	@echo "  make restart        Restart all containers"
	@echo "  make logs           Follow container logs"
	@echo "  make test           Run backend tests"
	@echo "  make lint           Run linters on backend and frontend"
	@echo "  make format         Auto-format code"
	@echo "  make backend-shell  Open a shell in the backend container"
	@echo "  make frontend-shell Open a shell in the frontend container"
	@echo "  make clean          Remove all containers, volumes, and images"
	@echo ""

# Docker Compose
build:
	docker-compose up --build

up:
	docker-compose up -d

down:
	docker-compose down

restart: down up

logs:
	docker-compose logs -f

# Testing
test:
	docker-compose -f docker-compose.yml -f docker-compose.test.yml up --build --abort-on-container-exit

test-backend:
	cd backend && python -m pytest tests/ -v

test-frontend:
	cd frontend && npm test

# Linting
lint:
	cd backend && python -m flake8 app/ --max-line-length=120
	cd frontend && npm run lint

format:
	cd backend && python -m black app/ --line-length=120
	cd frontend && npm run format

# Shell access
backend-shell:
	docker-compose exec backend sh

frontend-shell:
	docker-compose exec frontend sh

# Cleanup
clean:
	docker-compose down -v --rmi all --remove-orphans
