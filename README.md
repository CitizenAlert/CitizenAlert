# CitizenAlert - Hazard Reporting Mobile App

A citizen hazard reporting application built with React Native (Expo) and NestJS.

## Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Docker** and Docker Compose

## Setup

### 1. Install Dependencies

```bash
make install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and update:
- `EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:3002` (get IP with `ip addr show | grep "inet " | grep -v "127.0.0.1"`)
- `ALLOWED_ORIGINS=http://localhost:3002,http://localhost:8081,http://YOUR_COMPUTER_IP:3002`
- Other settings as needed

## Running the App

### Start Everything (API + Mobile)

```bash
make dev
```

### Start Backend + Database Only

```bash
make dev-api
```

Runs on:
- API: `http://localhost:3002`
- Database: `localhost:5434`

### Start Mobile App Only (in another terminal)

```bash
make dev-mobile
```

Then scan the QR code with Expo Go on your phone.

## Available Make Commands

```bash
make help              # Show all commands
make install           # Install dependencies
make dev               # Start API + mobile (parallel)
make dev-api           # Start API + database (Docker)
make dev-mobile        # Start Expo dev server
make dev-api-only      # Start API without Docker (requires local PostgreSQL)
make build             # Build API for production
make build-api         # Build API only
make build-mobile      # Build mobile app
make test              # Run tests
make test-api          # Run API tests
make lint              # Lint all packages
make format            # Format code with Prettier
make db-migrate        # Run database migrations
make db-shell          # Access PostgreSQL shell
make docker-up         # Start Docker containers
make docker-down       # Stop Docker containers
make docker-logs       # View Docker logs
make docker-rebuild    # Rebuild Docker containers
make clean             # Clean all artifacts
```
