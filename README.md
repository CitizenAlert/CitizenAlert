# CitizenAlert - Application Mobile de Signalement de Dangers 🇫🇷

Une application citoyenne de signalement de dangers construite avec React Native (Expo) et NestJS.

**Interface 100% en français** - Toutes les interfaces utilisateur sont traduites en français.

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

**Note pour les notifications push Android:** Les notifications push ne sont pas entièrement supportées dans Expo Go pour SDK 53+. Pour tester les notifications push sur Android, vous devez créer un Development Build. Voir `ANDROID_PUSH_NOTIFICATIONS_SETUP.md` pour plus de détails. Les notifications push iOS fonctionnent correctement dans Expo Go.

That's it!

## 🇫🇷 Interface en Français

L'application mobile est **100% en français**. Tous les textes de l'interface utilisateur, messages d'erreur, et notifications sont traduits.

Pour plus de détails, voir `FRENCH_TRANSLATION_COMPLETE.md`.

## 📱 Notifications Push Android

Pour configurer et tester les notifications push sur Android, suivez le guide complet:

📄 **[ANDROID_PUSH_NOTIFICATIONS_SETUP.md](ANDROID_PUSH_NOTIFICATIONS_SETUP.md)**

Ce guide couvre:
- Pourquoi Expo Go ne supporte pas les notifications push Android (SDK 53+)
- Comment créer un Development Build
- Configuration Firebase (production)
- Tests et dépannage

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

## Features

- 🗺️ Interactive map with hazard markers
- 📍 Real-time location tracking
- 📸 Photo upload for hazards
- 🔔 In-app notifications
- 📱 Push notifications (Expo)
- 👤 User authentication (JWT)
- 🏛️ Role-based access control (Citizen, Municipality, Admin)
- 📊 Hazard status management
- 🔒 Secure account management

## Tech Stack

- **Backend**: NestJS, TypeORM, PostgreSQL, JWT Authentication
- **Mobile**: React Native, Expo, Expo Notifications, Zustand, React Native Maps
- **DevOps**: Docker, pnpm workspaces

## Push Notifications

Push notifications are automatically configured and work on physical devices:

1. **Automatic Setup**: When you login, the app requests notification permissions
2. **Physical Device Required**: Push notifications only work on real iOS/Android devices (not simulators)
3. **Platform Support**:
   - ✅ **iOS**: Works perfectly with Expo Go
   - ⚠️ **Android**: Requires development build (Expo Go doesn't support push in SDK 53+)
4. **Events**: Receive notifications when:
   - You create a new hazard
   - A municipality changes the status of your hazard

For more details, see `PUSH_NOTIFICATIONS_SETUP.md`

## License

Private - © 2026
