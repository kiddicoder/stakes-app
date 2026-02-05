# Roadmap

## Snapshot (2026-02-05)
- Repository: `kiddicoder/stakes-app` (public)
- Branching: working directly on `main` for now
- Stack: Expo Router mobile + Hono API + Drizzle + Supabase
- Current build status:
  - Mobile TypeScript check passes
  - API starts with `npm run dev:api` (port conflict if another API process is already running)

## Week 1: Foundation
- [x] Monorepo scaffolding and workspace scripts
- [x] Mobile app base navigation (Expo Router)
- [x] API server skeleton (Hono)
- [x] Database schema and initial migrations (Drizzle)
- [x] Supabase wiring (auth client + DB connection + service role validation path)
- [x] Basic auth flow (magic link with web redirect handling)
- [x] User profile bootstrap and update endpoints

## Week 2: Core Commitments
- [x] Create commitment flow (baseline implementation)
- [x] Commitment detail screen (baseline implementation)
- [x] Check-in submission flow
- [x] Referee selection via username search in commitment create flow
- [x] Referee verification API flow (pending list, verify, dispute)
- [x] Referee verification mobile queue screen
- [x] Home dashboard with active commitments and pending actions

## Week 3: Payments and Settlement
- [ ] Stripe integration (setup intent + payment intents)
- [ ] Add payment method flow
- [ ] Stakes charging on commitment activation
- [ ] Settlement job (win/lose)
- [ ] Basic user stats UI

## Week 4: Polish and Launch
- [ ] Push notifications
- [ ] Notifications screen
- [ ] Profile with stats visualization
- [ ] Friends system (basic)
- [ ] Bug fixes and visual polish pass
- [ ] TestFlight / Play Store internal testing

## Post-MVP (Weeks 5-8)
- [ ] Challenges (head-to-head)
- [x] Activity feed baseline (created/check-in activity stream)
- [ ] Leaderboards
- [ ] Charities and anti-charities
- [ ] Stripe Connect for referee payouts
- [ ] Advanced stats
- [ ] Public profiles and sharing

## Next Up (Immediate)
1. Add friend-request based referee picker (limit to accepted friends, not global users).
2. Implement challenge create/detail/check-in flow with settlement-ready schema usage.
3. Add notification center wiring with real backend notifications data.
4. Start Stripe setup intents and stake capture flow for activation.
