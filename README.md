# Recipe Manager

A minimal, full-stack recipe management application built for a 45-minute workshop. It features OTP-based phone authentication powered by the Minimoth API, SQLite storage, and a responsive React UI.

## Architecture & Scope

- **Frontend Pages (3)**:
  1. `AuthPage` — User registration and login via OTP (E.164 phone numbers)
  2. `RecipeListPage` — View user recipes and delete items
  3. `RecipeFormPage` — Add and save a new recipe
- **Backend API Endpoints (5)**:
  1. `POST /api/auth/send-otp` — Request OTP via Minimoth (with demo fallback)
  2. `POST /api/auth/verify-otp` — Verify 6-digit OTP and authenticate user
  3. `GET /api/recipes` — List recipes belonging to current user
  4. `POST /api/recipes` — Create a new recipe
  5. `DELETE /api/recipes/:id` — Delete a recipe
- **Database Entities / Tables (3)**:
  1. `users` (`id`, `phone`, `created_at`)
  2. `otps` (`id`, `phone`, `code`, `expires_at`, `created_at`)
  3. `recipes` (`id`, `user_id`, `title`, `ingredients`, `instructions`, `created_at`)

## Tech Stack

- **Frontend**: React 18, Vite, CSS
- **Backend**: Node.js, Express, `@minimoth/sdk-node`, SQLite3

## Getting Started

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Configure `backend/.env`:
```env
PORT=3001
MINIMOTH_API_KEY=your_minimoth_api_key_here
```
> **Note**: If `MINIMOTH_API_KEY` is not provided or set to `demo_key`, the backend runs in demo mode and returns the OTP code in the response for local development.

Start the backend:
```bash
npm run dev
```

### 2. Frontend Setup

In a second terminal:
```bash
cd frontend
npm install
cp .env.example .env
```

Configure `frontend/.env`:
```env
VITE_API_BASE_URL=/api
VITE_APP_NAME=Recipe Manager
```

Start the frontend:
```bash
npm run dev
```

Open `http://localhost:5173` in your browser.
