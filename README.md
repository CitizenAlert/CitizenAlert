# CitizenAlert - Hazard Reporting Mobile App

A citizen hazard reporting application built with React Native (Expo) and NestJS.

## Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0 (install with `npm install -g pnpm`)
- **Docker** and Docker Compose v2

## Quick Start

### 1. Install Dependencies

```bash
make install
```

### 2. Start Development

Open **2 terminals** and run:

**Terminal 1 - Database:**
```bash
docker compose -f docker/docker-compose.yml up postgres
```

**Terminal 2 - API:**
```bash
make dev-api
```
→ API runs on http://localhost:3000/api

**Terminal 3 - Mobile:**
```bash
make dev-mobile
```
→ Scan the QR code with **Expo Go** app on your phone

## Development Commands

| Command | Description |
|---------|-------------|
| `make install` | Install all dependencies |
| `make dev` | Show setup instructions |
| `make dev-api` | Start API server (local, watch mode) |
| `make dev-mobile` | Start Expo dev server with QR code |
| `make dev-api-docker` | Start API + Database in Docker |

## Project Structure

```
├── apps/
│   ├── api/          # NestJS backend
│   └── mobile/       # Expo React Native app
├── packages/
│   └── shared/       # Shared code between API and mobile
└── docker/           # Docker configuration
```

## Environment Variables

The `.env` file is already configured. Key variables:

- `DB_PORT=5434` - PostgreSQL port
- `JWT_SECRET` - Secret for JWT tokens
- `EXPO_PUBLIC_API_URL` - API URL for mobile app

## Testing

```bash
make test          # Run all tests
make test-api      # Run API tests only
```

## Building for Production

```bash
make build-api     # Build API
make build-mobile  # Build mobile app
```

## Troubleshooting

### Port already in use
```bash
# Kill processes on ports
pkill -f "expo|metro|nest"
```

### Database connection failed
```bash
# Make sure PostgreSQL is running
docker compose -f docker/docker-compose.yml up postgres
```

### Mobile app not connecting to API
- Make sure API is running on http://localhost:3000/api
- Check `EXPO_PUBLIC_API_URL` in `.env`
- If using physical device, use your computer's IP address instead of localhost

## Tech Stack

- **Backend**: NestJS, TypeORM, PostgreSQL, JWT Authentication
- **Mobile**: React Native, Expo, Zustand
- **DevOps**: Docker, pnpm workspaces

## License

Private - © 2026
