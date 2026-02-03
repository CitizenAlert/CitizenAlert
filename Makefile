.PHONY: help install dev dev-api dev-mobile build build-api build-mobile test test-api lint format clean db-migrate db-shell docker-up docker-down docker-logs

# Color output
BLUE := \033[0;34m
GREEN := \033[0;32m
RED := \033[0;31m
NC := \033[0m # No Color

help:
	@echo "$(BLUE)CitizenAlert - Available Commands$(NC)"
	@echo ""
	@echo "$(GREEN)Installation & Setup:$(NC)"
	@echo "  make install        Install all dependencies"
	@echo "  make clean          Remove all node_modules and build artifacts"
	@echo ""
	@echo "$(GREEN)Development:$(NC)"
	@echo "  make dev            Start both API and mobile app (parallel)"
	@echo "  make dev-api        Start API server with Docker (localhost:3000)"
	@echo "  make dev-mobile     Start Expo dev server"
	@echo "  make dev-api-only   Start API server without Docker (requires local PostgreSQL)"
	@echo ""
	@echo "$(GREEN)Build:$(NC)"
	@echo "  make build          Build API for production"
	@echo "  make build-api      Build API only"
	@echo "  make build-mobile   Build mobile app"
	@echo ""
	@echo "$(GREEN)Database:$(NC)"
	@echo "  make db-migrate     Run database migrations"
	@echo "  make db-shell       Access PostgreSQL shell"
	@echo ""
	@echo "$(GREEN)Docker:$(NC)"
	@echo "  make docker-up      Start Docker containers (API + PostgreSQL)"
	@echo "  make docker-down    Stop Docker containers"
	@echo "  make docker-logs    View Docker logs"
	@echo "  make docker-rebuild Rebuild Docker containers"
	@echo ""
	@echo "$(GREEN)Code Quality:$(NC)"
	@echo "  make lint           Lint all packages"
	@echo "  make format         Format code with Prettier"
	@echo ""
	@echo "$(GREEN)Testing:$(NC)"
	@echo "  make test           Run all tests"
	@echo "  make test-api       Run API tests"
	@echo ""

install:
	@echo "$(BLUE)Installing dependencies...$(NC)"
	pnpm install

dev:
	@echo "$(BLUE)Starting CitizenAlert (API + Mobile)...$(NC)"
	pnpm dev

dev-api:
	@echo "$(BLUE)Starting API server with Docker...$(NC)"
	@echo "$(GREEN)Database: localhost:5434$(NC)"
	@echo "$(GREEN)API: http://localhost:3002$(NC)"
	docker-compose -f docker/docker-compose.yml up

dev-mobile:
	@echo "$(BLUE)Starting Expo dev server...$(NC)"
	pnpm --filter mobile start

dev-api-only:
	@echo "$(BLUE)Starting API server (local mode)...$(NC)"
	@echo "$(RED)Note: Requires PostgreSQL running on localhost:5432$(NC)"
	pnpm --filter api start:dev

build: build-api
	@echo "$(GREEN)Build complete!$(NC)"

build-api:
	@echo "$(BLUE)Building API...$(NC)"
	pnpm --filter api build

build-mobile:
	@echo "$(BLUE)Building mobile app...$(NC)"
	pnpm --filter mobile build

test: test-api
	@echo "$(GREEN)All tests passed!$(NC)"

test-api:
	@echo "$(BLUE)Running API tests...$(NC)"
	pnpm --filter api test

test-api-watch:
	@echo "$(BLUE)Running API tests in watch mode...$(NC)"
	pnpm --filter api test:watch

test-api-cov:
	@echo "$(BLUE)Running API tests with coverage...$(NC)"
	pnpm --filter api test:cov

lint:
	@echo "$(BLUE)Linting all packages...$(NC)"
	pnpm lint

format:
	@echo "$(BLUE)Formatting code...$(NC)"
	pnpm format

db-migrate:
	@echo "$(BLUE)Running database migrations...$(NC)"
	pnpm --filter api typeorm migration:run

db-shell:
	@echo "$(BLUE)Connecting to PostgreSQL...$(NC)"
	docker exec -it citizen-alert-postgres psql -U postgres -d citizen_alert

docker-up:
	@echo "$(BLUE)Starting Docker containers...$(NC)"
	docker-compose -f docker/docker-compose.yml up -d
	@echo "$(GREEN)✓ PostgreSQL running on localhost:5432$(NC)"
	@echo "$(GREEN)✓ API running on http://localhost:3000$(NC)"

docker-down:
	@echo "$(BLUE)Stopping Docker containers...$(NC)"
	docker-compose -f docker/docker-compose.yml down

docker-logs:
	@echo "$(BLUE)Viewing Docker logs...$(NC)"
	docker-compose -f docker/docker-compose.yml logs -f

docker-rebuild:
	@echo "$(BLUE)Rebuilding Docker containers...$(NC)"
	docker-compose -f docker/docker-compose.yml up --build -d

clean:
	@echo "$(BLUE)Cleaning up...$(NC)"
	pnpm clean
	@echo "$(GREEN)✓ Cleanup complete$(NC)"

# Aliases for common commands
start: dev
	@true

api: dev-api
	@true

mobile: dev-mobile
	@true

logs: docker-logs
	@true

ps:
	@echo "$(BLUE)Docker containers:$(NC)"
	docker ps

status: ps
	@true

.SILENT: help
