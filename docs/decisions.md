# Architecture Decisions

This file records the main technical decisions and why we made them. Add new entries as the project evolves.

## ADR-0001: Monorepo With NPM Workspaces
- Decision: Use a monorepo with npm workspaces.
- Rationale: One install, consistent tooling, easy sharing of types and utilities.
- Alternatives: Separate repos; pnpm or yarn workspaces.

## ADR-0002: Expo + React Native
- Decision: Use Expo for the mobile app.
- Rationale: Faster iteration, managed builds, no local Xcode/Android Studio setup required.
- Alternatives: React Native bare; Flutter.

## ADR-0003: API With Hono + TypeScript
- Decision: Use Hono as the API framework.
- Rationale: Small, fast, TypeScript-first, easy to deploy.
- Alternatives: Express; Fastify; FastAPI.

## ADR-0004: Supabase for Auth + Postgres + Storage
- Decision: Use Supabase as the primary backend platform.
- Rationale: Postgres + auth + storage in one place, quick to launch and scale.
- Alternatives: Neon for Postgres; custom auth; S3 for storage.

## ADR-0005: Drizzle ORM
- Decision: Use Drizzle for type-safe DB access.
- Rationale: Lightweight, great DX, first-class TypeScript schema.
- Alternatives: Prisma; TypeORM.

## ADR-0006: Payments via Stripe
- Decision: Stripe for payment intents and Connect for payouts.
- Rationale: Best-in-class payments, global support, solid docs, handles compliance.
- Alternatives: Adyen; Braintree; Paddle.
