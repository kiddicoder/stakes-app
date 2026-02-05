# Living Context

This file is a high-detail handoff doc so future sessions can recover project state quickly.

## Product Direction
- App concept: accountability commitments with optional financial stakes.
- Core loop for MVP:
  - user creates commitment
  - user checks in on schedule
  - referee verifies when stakes are active
  - settlement/stat updates (partially implemented, still pending)

## Repository and Runtime
- GitHub repo: `https://github.com/kiddicoder/stakes-app`
- Monorepo layout:
  - `apps/mobile`: Expo app (Expo Router)
  - `apps/api`: Hono API
  - `packages/shared`: shared constants/types scaffold
- Workspace scripts from root:
  - `npm run dev:mobile`
  - `npm run dev:api`
  - `npm run db:generate`
  - `npm run db:migrate`

## Environment
- Mobile env file: `apps/mobile/.env`
  - expects `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- API env file: `apps/api/.env`
  - expects `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, Stripe keys and runtime vars

## Supabase Notes
- Magic-link redirects for local development should include:
  - `http://localhost:8081/verify`
  - `accountability://verify`
- Direct DB connection can fail in some environments due IPv6 requirements.
- Session pooler URL is a safer fallback for local development.
- Auth email rate limits can block repeated OTP testing.

## Implemented Backend Surface
- Auth:
  - `GET /auth/me` validates token and ensures local user profile exists.
- Users:
  - `GET /users/me`, `PATCH /users/me`, `GET /users/search`, `GET /users/:id`, `GET /users/:id/stats`
- Commitments:
  - `POST /commitments`, `GET /commitments`, `GET /commitments/:id`
  - `GET /commitments/:id/check-ins`, `POST /commitments/:id/check-ins`
  - `GET /commitments/dashboard` (home summary endpoint)
- Referee check-ins:
  - `GET /check-ins/pending-verification`
  - `POST /check-ins/:id/verify`
  - `POST /check-ins/:id/dispute`

## Dashboard Endpoint Contract
- Route: `GET /commitments/dashboard`
- Returns:
  - profile (`username`, `displayName`)
  - stats (`currentStreak`, `longestStreak`, `commitmentsWon`, `commitmentsLost`)
  - active commitments with derived fields:
    - `completedCount`
    - `progressPercent`
    - `daysRemaining`
    - `checkInDueToday`
  - pending actions:
    - `checkInsDueToday`
    - `refereeVerificationsNeeded`
    - `challengeInvites` (currently hardcoded `0`)

## Implemented Mobile Surface
- Auth screens:
  - `apps/mobile/app/(auth)/login.tsx`
  - `apps/mobile/app/(auth)/register.tsx`
  - `apps/mobile/app/(auth)/verify.tsx`
- Tab shell:
  - custom tab icons/style in `apps/mobile/app/(tabs)/_layout.tsx`
- Home:
  - live dashboard integration in `apps/mobile/app/(tabs)/index.tsx`
  - sections: hero, pending actions, active commitments, challenges placeholder
- Create:
  - baseline form in `apps/mobile/app/(tabs)/create.tsx`
- Detail and check-in:
  - `apps/mobile/app/commitment/[id].tsx`
  - `apps/mobile/app/commitment/check-in.tsx`

## Known Gaps
- Challenges are not implemented end-to-end yet.
- Feed tab remains placeholder.
- Friends tab remains placeholder.
- Notifications tab remains placeholder.
- Payment lifecycle and Stripe webhook processing still pending.
- Settlement jobs exist in plan, not implemented.

## Stability Notes
- Expo may auto-rewrite `apps/mobile/tsconfig.json` include list in some runs.
- `apps/mobile/expo-env.d.ts` can disappear and must be restored if removed.
- `npm run dev:api` will fail with `EADDRINUSE` when port `3000` already has a running API.

## Suggested Next Dev Sequence
1. Build referee invitation UX in create flow and enforce selection via friend search.
2. Add mobile referee queue screen using `/check-ins/pending-verification`.
3. Build minimal activity feed backend and populate feed tab.
4. Start Stripe setup intent + stored method UI.
