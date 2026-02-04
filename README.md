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

**Terminal 1 - Backend (Database + API):**
```bash
make dev-api
```
→ Database on localhost:5434
→ API on http://localhost:3001/api

**Terminal 2 - Frontend (Mobile):**
```bash
make dev-mobile
```
→ Scan the QR code with **Expo Go** app on your phone

That's it! 🚀

## Development Commands

| Command | Description |
|---------|-------------|
| `make install` | Install all dependencies |
| `make dev` | Show setup instructions |
| `make dev-api` | Start Database + API (backend) |
| `make dev-mobile` | Start Expo dev server (frontend) |
| `make clean` | Remove node_modules and build artifacts |

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

### After `make clean`, API won't start
Run `make install` to reinstall dependencies.

### Port already in use
```bash
pkill -f "expo|metro|nest"  # Kill running processes
docker compose -f docker/docker-compose.yml down  # Stop database
```

### Mobile app not connecting to API
- Make sure API is running: `make dev-api` in Terminal 1
- Check `EXPO_PUBLIC_API_URL` in `.env`
- For physical device: Use your computer's IP instead of localhost

### Port 3001 already in use
Edit `.env` and change `API_PORT=3001` to another port (e.g., `3002`, `3003`)
Then restart: `make dev-api`

## Tech Stack

- **Backend**: NestJS, TypeORM, PostgreSQL, JWT Authentication
- **Mobile**: React Native, Expo, Zustand
- **DevOps**: Docker, pnpm workspaces

## License

Private - © 2026
