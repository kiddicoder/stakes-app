# Local Setup

This guide is the source of truth for developer setup.

## Prerequisites
- Node.js 20+
- npm 10+
- Git
- Expo CLI (comes with Expo; optional to install globally)

## Install Dependencies
```bash
npm install
```

## Environment Variables

### Mobile (apps/mobile/.env)
```
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### API (apps/api/.env)
```
DATABASE_URL=postgresql://...
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_KEY=YOUR_SERVICE_KEY
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
EXPO_ACCESS_TOKEN=YOUR_EXPO_TOKEN
JWT_SECRET=change-me
NODE_ENV=development
PORT=3000
```

## Run the Apps

### Mobile
```bash
npm run dev:mobile
```

### API
```bash
npm run dev:api
```

## Supabase Setup
1. Create a project at supabase.com.
2. Enable Email auth under Authentication.
3. Create a storage bucket named `proof-photos`.
4. Grab the project URL and keys from Settings > API.

## Database Migrations (Drizzle)
```bash
npm run db:generate
npm run db:migrate
```

## Stripe Setup
1. Create a Stripe account.
2. Get API keys from Developers > API keys.
3. Enable Stripe Connect in Connect settings.
4. Create a webhook endpoint for:
   - payment_intent.succeeded
   - payment_intent.payment_failed
   - account.updated

## Troubleshooting
- If you see `EMFILE: too many open files, watch` when running Expo:
  - Install Watchman: `brew install watchman`
  - Or temporarily increase the open file limit: `ulimit -n 8192` (run in the same shell before `npm run dev:mobile`)
- If Expo cannot reach the API, ensure `EXPO_PUBLIC_API_URL` points to a reachable host.
- For device testing, use your machine IP (e.g., `http://192.168.1.5:3000`).
