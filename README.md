# CitizenAlert - Hazard Reporting Mobile App

A Waze-like citizen hazard reporting application built with React Native (Expo) and NestJS in a clean monorepo architecture.

## Overview

CitizenAlert allows citizens to report and view hazards (accidents, road issues, warnings) on an interactive map with real-time geolocation. This is a proof-of-concept implementation demonstrating a scalable, type-safe architecture.

## Tech Stack

### Frontend (Mobile)
- **React Native** with Expo SDK 50
- **Expo Router** for file-based navigation
- **TypeScript** for type safety
- **Zustand** for state management
- **Axios** for HTTP requests
- **React Native Maps** for map display

### Backend (API)
- **NestJS** framework
- **TypeORM** for database ORM
- **PostgreSQL** database
- **JWT** for authentication
- **Passport** for auth strategies
- **Docker** for containerization

### Infrastructure
- **pnpm** for fast package management
- **Monorepo** with workspaces
- **Docker Compose** for orchestration
- **ESLint + Prettier** for code quality

## Project Structure

```
projet_annuel_m2/
├── apps/
│   ├── mobile/           # React Native Expo app
│   │   ├── app/          # Expo Router (file-based routing)
│   │   └── src/          # Components, services, stores, types
│   └── api/              # NestJS backend
│       └── src/
│           ├── modules/  # Feature modules (auth, users, hazards)
│           ├── config/   # Configuration
│           └── common/   # Shared utilities
├── packages/
│   └── shared/           # Shared types across apps
├── docker/               # Docker configuration
├── scripts/              # PRD and utility scripts
├── tasks/                # Task tracking (taskmaster-ai)
└── package.json          # Root workspace config
```

## Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Docker** and Docker Compose
- **Expo CLI** (for mobile development)
- **Expo Go app** (to test on your phone)

### Quick Start

1. **Get your computer's IP address:**
   ```bash
   ip addr show | grep "inet " | grep -v "127.0.0.1"
   ```

2. **Update `.env`** with your IP:
   ```bash
   cp .env.example .env
   # Edit .env and replace YOUR_COMPUTER_IP with your actual IP
   ```

3. **Start backend and database:**
   ```bash
   make dev-api
   ```
   In another terminal, **start mobile app:**
   ```bash
   make dev-mobile
   ```

4. **Connect phone:** Open Expo Go on your phone, scan the QR code, ensure phone is on same WiFi network.

### Installation

1. **Clone the repository**
   ```bash
   cd projet_annuel_m2
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Edit .env file with your configuration**
   ```bash
   nano .env
   ```

### Running the Application

#### Quick Start (All-in-One)

**Using Makefile:**
```bash
make dev
```

**Using Taskfile:**
```bash
task dev
```

**Using pnpm:**
```bash
pnpm dev
```

Runs both backend and mobile in parallel.

#### Start Backend + Database (Docker)

**Using Makefile:**
```bash
make dev-api
```

**Using Taskfile:**
```bash
task dev-api
```

**Using pnpm:**
```bash
pnpm dev:api
```

This will start:
- PostgreSQL database on port 5434 (external) / 5432 (internal Docker)
- NestJS API on port 3002 (external) / 3000 (internal Docker)

#### Start Mobile App

In a new terminal:

**Using Makefile:**
```bash
make dev-mobile
```

**Using Taskfile:**
```bash
task dev-mobile
```

**Using pnpm:**
```bash
pnpm dev:mobile
```

This will start the Expo dev server. Scan the QR code with:
- **iOS**: Camera app or Expo Go app
- **Android**: Expo Go app

## Available Scripts

### Using Makefile (Recommended)

Simply use `make` commands for a cleaner experience:

```bash
make help              # Show all available commands
make install           # Install dependencies
make dev               # Start both API and mobile (parallel)
make dev-api           # Start API + database (Docker)
make dev-mobile        # Start Expo dev server
make build             # Build API for production
make test              # Run tests
make lint              # Lint all packages
make format            # Format code
make clean             # Clean all artifacts
```

### Using Taskfile (Alternative)

If you have [Task](https://taskfile.dev) installed:

```bash
task help              # Show all available commands
task install           # Install dependencies
task dev               # Start both API and mobile (parallel)
task dev-api           # Start API + database (Docker)
task dev-mobile        # Start Expo dev server
task build             # Build API for production
task test              # Run tests
task lint              # Lint all packages
task format            # Format code
task clean             # Clean all artifacts
```

### Root Level (pnpm)

Or use pnpm directly:

- `pnpm dev` - Start all services
- `pnpm dev:api` - Start API + database in Docker
- `pnpm dev:mobile` - Start Expo dev server
- `pnpm build:api` - Build API for production
- `pnpm db:migrate` - Run database migrations
- `pnpm db:shell` - Access PostgreSQL shell
- `pnpm lint` - Lint all packages
- `pnpm format` - Format code with Prettier
- `pnpm clean` - Clean all node_modules

### API (apps/api)

```bash
cd apps/api
pnpm start:dev    # Development with hot reload
pnpm build        # Build for production
pnpm start:prod   # Run production build
pnpm test         # Run tests
```

### Mobile (apps/mobile)

```bash
cd apps/mobile
pnpm start        # Start Expo dev server
pnpm android      # Run on Android
pnpm ios          # Run on iOS
pnpm web          # Run in web browser
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/profile` - Get current user profile (protected)

### Users
- `GET /api/users` - Get all users (protected)
- `GET /api/users/:id` - Get user by ID (protected)
- `PATCH /api/users/:id` - Update user (protected)
- `DELETE /api/users/:id` - Delete user (protected)

### Hazards
- `GET /api/hazards` - Get all hazards
- `GET /api/hazards/active` - Get active hazards only
- `GET /api/hazards/nearby?lat=X&lon=Y&radius=Z` - Get hazards near location
- `GET /api/hazards/:id` - Get hazard by ID
- `POST /api/hazards` - Create new hazard (protected)
- `PATCH /api/hazards/:id` - Update hazard (protected, owner only)
- `DELETE /api/hazards/:id` - Delete hazard (protected, owner only)

### Health
- `GET /api/health` - API health check

## Database Schema

### Users Table
```sql
id           UUID PRIMARY KEY
email        VARCHAR UNIQUE NOT NULL
password     VARCHAR NOT NULL (bcrypt hashed)
firstName    VARCHAR NOT NULL
lastName     VARCHAR NOT NULL
phoneNumber  VARCHAR
isActive     BOOLEAN DEFAULT true
createdAt    TIMESTAMP
updatedAt    TIMESTAMP
```

### Hazards Table
```sql
id          UUID PRIMARY KEY
type        ENUM (accident, road_issue, warning, police, other)
description TEXT NOT NULL
latitude    DECIMAL(10,7) NOT NULL
longitude   DECIMAL(10,7) NOT NULL
address     VARCHAR
status      ENUM (active, resolved, archived)
imageUrl    VARCHAR
userId      UUID FOREIGN KEY REFERENCES users(id)
createdAt   TIMESTAMP
updatedAt   TIMESTAMP
```

## Environment Variables

Create a `.env` file based on `.env.example`:

See `.env.example` for complete configuration. Key variables:
- `EXPO_PUBLIC_API_URL` - Set to your computer's IP: `http://YOUR_IP:3002`
- `ALLOWED_ORIGINS` - Update to match your IP: `http://localhost:3002,http://localhost:8081,http://YOUR_IP:3002`
- `API_PORT` - Set to 3002 (Docker external port)
- `JWT_SECRET` - Change in production

## Docker Commands

```bash
# Start services
docker-compose -f docker/docker-compose.yml up -d

# View logs
docker-compose -f docker/docker-compose.yml logs -f

# Stop services
docker-compose -f docker/docker-compose.yml down

# Rebuild containers
docker-compose -f docker/docker-compose.yml up --build

# Access database
docker exec -it citizen-alert-postgres psql -U postgres -d citizen_alert
```

## Development Workflow

1. **Backend Development**
   - Make changes in `apps/api/src`
   - Hot reload enabled in dev mode
   - Test with `curl` or Postman

2. **Mobile Development**
   - Make changes in `apps/mobile/app` or `apps/mobile/src`
   - Changes reflect immediately in Expo Go
   - Use React DevTools for debugging

3. **Database Changes**
   - Modify entities in `apps/api/src/modules/*/entities`
   - TypeORM synchronize is ON in dev (auto-creates tables)
   - For production, use migrations

## Testing

### API Tests
```bash
cd apps/api
pnpm test          # Run unit tests
pnpm test:e2e      # Run e2e tests
pnpm test:cov      # Run with coverage
```

### Manual Testing
1. Start the API with `make dev-api`
2. Test health: `curl http://localhost:3002/api/health`
3. Register: `curl -X POST http://localhost:3002/api/auth/register -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'`
4. Login and get token
5. Use token: `Authorization: Bearer <token>`

## Architecture Principles

### Clean Architecture
- **Separation of concerns** - Each module has clear boundaries
- **Feature-based organization** - Code organized by domain features
- **Dependency injection** - Using NestJS DI container
- **Interface-based design** - Abstract over concrete implementations

### SOLID Principles
- **Single Responsibility** - Each class/module has one job
- **Open/Closed** - Open for extension, closed for modification
- **Liskov Substitution** - Subtypes must be substitutable
- **Interface Segregation** - Small, focused interfaces
- **Dependency Inversion** - Depend on abstractions

### Security
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens for stateless authentication
- Input validation with class-validator
- CORS configuration
- Environment-based secrets

## Troubleshooting

### Docker Issues

**PostgreSQL won't start:**
```bash
docker-compose -f docker/docker-compose.yml down -v
docker-compose -f docker/docker-compose.yml up -d
```

**API can't connect to database:**
- Check `DATABASE_URL` in `.env`
- Ensure PostgreSQL container is healthy: `docker ps`
- Check logs: `docker logs citizen-alert-postgres`

### Mobile App Issues

**Expo won't start:**
```bash
cd apps/mobile
rm -rf node_modules .expo
pnpm install
pnpm start -c  # Clear cache
```

**Can't connect to API:**
- Update `EXPO_PUBLIC_API_URL` in `.env`
- For physical devices, use computer's IP (not localhost)
- Check firewall settings

### Module Resolution Issues

**TypeScript can't find modules:**
```bash
pnpm install
cd apps/api && pnpm build
cd ../mobile && pnpm build
```

## Contributing

1. Follow the existing code style
2. Write meaningful commit messages
3. Add tests for new features
4. Update documentation
5. Run linter before committing: `pnpm lint`

## Roadmap

### Phase 1 (Current - POC) ✅
- [x] Monorepo setup
- [x] User authentication
- [x] CRUD operations for hazards
- [x] Basic mobile app structure
- [x] Docker configuration

### Phase 2 (Next)
- [ ] Interactive map with markers
- [ ] Photo upload for hazards
- [ ] Hazard filtering
- [ ] Push notifications
- [ ] User profile management

### Phase 3 (Future)
- [ ] Social features (comments, likes)
- [ ] Hazard verification
- [ ] Analytics dashboard
- [ ] Admin panel
- [ ] Multi-language support

## License

MIT License - See LICENSE file for details

## Contact

For questions or issues, please create an issue in the repository.

## Acknowledgments

- Inspired by Waze's community-driven approach
- Built with modern TypeScript ecosystem
- Leverages Expo's powerful mobile development platform
