# FreshTrack 🌱

AI-powered food waste reduction mobile app — track your food inventory, get AI recipe suggestions for expiring ingredients, reduce household waste, and earn gamification rewards.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile Frontend | React Native + Expo (TypeScript) |
| State Management | Redux Toolkit |
| Backend API | Node.js + Express (TypeScript) |
| Database | PostgreSQL (Knex query builder) |
| Authentication | JWT + bcrypt |
| AI Services | Stub/mock implementations (ready to swap for OpenAI, etc.) |

## Features

- **🥗 Inventory Tracking** — Add food items manually; get expiry countdowns
- **🤖 AI Recipe Suggestions** — Personalized recipes based on expiring ingredients
- **🛒 Shopping List** — Manual + AI auto-generated shopping lists
- **📊 Waste Analytics** — Charts showing waste trends; money saved
- **🤝 Community Board** — Share, give away, or trade excess food
- **🏆 Gamification** — Points, streaks, and achievement badges
- **🔔 Push Notifications** — Expiry alerts

## Project Structure

```
mobileapp/
├── frontend/          # React Native Expo app
│   ├── App.tsx        # Root component with Redux Provider + navigation
│   ├── app.json       # Expo config
│   └── src/
│       ├── navigation/  AppNavigator (auth stack + bottom tabs + modals)
│       ├── screens/     Home, Inventory, AddItem, Recipes, Analytics,
│       │                ShoppingList, Community, Profile, Login, Register
│       ├── components/  InventoryItem, RecipeCard, ExpiryBadge,
│       │                WasteChart, GamificationBadge
│       ├── services/    api.ts (axios), auth.ts (AsyncStorage), notifications.ts
│       ├── store/       Redux slices: auth, inventory, recipes, analytics
│       └── utils/       constants.ts, expiryHelper.ts
└── backend/           # Express API
    └── src/
        ├── index.ts          Express server entry point
        ├── config/           Knex/PostgreSQL connection
        ├── routes/           auth, inventory, recipes, analytics, shopping, community
        ├── controllers/      Request handlers (one per route group)
        ├── services/         aiService, ocrService, expiryService,
        │                     notificationService, gamificationService
        ├── models/           TypeScript interfaces for DB rows
        ├── middleware/        JWT auth guard, error handler
        └── migrations/       001_initial_schema.sql
```

## Quick Start

### Prerequisites

- Node.js ≥ 18
- PostgreSQL 14+
- Expo CLI (`npm install -g expo-cli`)

### 1. Backend

```bash
cd backend
cp .env.example .env          # fill in DB credentials & JWT_SECRET
psql -U postgres -c "CREATE DATABASE freshtrack;"
psql -U postgres -d freshtrack -f src/migrations/001_initial_schema.sql
npm install
npm run dev                   # starts on http://localhost:3000
```

### 2. Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm start                     # opens Expo DevTools
```

Scan the QR code with the Expo Go app, or press `i` / `a` for iOS Simulator / Android Emulator.

> **Note:** Update `API_BASE_URL` in `src/utils/constants.ts` to your machine's local IP (e.g. `http://192.168.1.x:3000/api`) when running on a physical device.

## Backend API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login → returns JWT |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/inventory` | List inventory items |
| POST | `/api/inventory` | Add item |
| PUT | `/api/inventory/:id` | Update item |
| DELETE | `/api/inventory/:id` | Delete item |
| GET | `/api/inventory/expiry-prediction` | AI expiry prediction |
| GET | `/api/recipes/recommendations` | AI recipe recommendations |
| GET | `/api/analytics/dashboard` | Dashboard stats |
| GET | `/api/analytics/waste` | Waste analytics |
| GET | `/api/shopping` | Shopping list |
| POST | `/api/shopping/auto-generate` | AI auto-generate list |
| GET | `/api/community` | Community posts |
| POST | `/api/community` | Create post |

## Environment Variables

See `backend/.env.example` for all supported variables.

## Database Schema

Six tables: `users`, `inventory_items`, `waste_logs`, `recipes`, `shopping_list_items`, `community_posts`. Full schema in `backend/src/migrations/001_initial_schema.sql`.

## AI Services

All AI features use realistic mock implementations in `backend/src/services/aiService.ts`. To integrate real AI, replace the mock functions with OpenAI/Gemini API calls and add `OPENAI_API_KEY` to `.env`.

## License

MIT
