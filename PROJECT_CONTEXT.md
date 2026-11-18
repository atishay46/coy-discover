# PROJECT_CONTEXT.md — Coy Discover

> Last updated: **Phase 1 complete** (2026-11-18)

---

## Project Objective

Build a standalone **Coy Discover** dating-app feature as a technical assignment.

The existing project already has a fully working frontend (Next.js, React, TypeScript, Tailwind CSS) with profile cards, swipe interactions, animations, navigation and mock data.

The goal is to convert the mock implementation into a **persistent application** using **Prisma + SQLite**, without breaking or redesigning the existing frontend.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js | 16.4.6 |
| UI | React | ^19 |
| Language | TypeScript | 5.7.3 |
| Styling | Tailwind CSS | ^4.3.3 |
| Animations | Framer Motion | ^14.14.0 |
| Icons | Lucide React | ^1.16.0 |
| ORM | Prisma | ^6.3.1 (stable) |
| Database | SQLite (local dev) | via Prisma datasource |
| DB client | @prisma/client | ^6.3.1 |
| Seed runner | tsx | ^4.19.3 |
| Package manager | pnpm | 12.3.4 |

---

## Project Structure

```
project/
├── prisma/
│   ├── schema.prisma          # Prisma schema (User, Swipe, Match)
│   ├── seed.ts                # Idempotent seed script (tsx)
│   ├── dev.db                 # SQLite database (gitignored)
│   └── migrations/
│       └── 20261118172331_init/
│           └── migration.sql  # Initial schema migration
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx           # Root → DiscoverApp
│   │   ├── discover/page.tsx
│   │   ├── home/page.tsx
│   │   └── matches/page.tsx
│   ├── components/
│   │   ├── BottomNavigation.tsx
│   │   ├── DiscoverApp.tsx    # Main swipe UI, calls services
│   │   └── ProfileCard.tsx    # Swipeable card with Framer Motion
│   ├── data/
│   │   ├── mockAdapter.ts     # In-memory/sessionStorage mock (unchanged)
│   │   └── mockProfiles.ts    # 30 static profiles (unchanged)
│   ├── lib/
│   │   └── db.ts              # Prisma client singleton (new)
│   ├── services/
│   │   ├── feedService.ts     # Fetches profiles (mock or API)
│   │   ├── swipeService.ts    # Submits swipes (mock or API)
│   │   └── matchService.ts    # Gets matches (mock or API)
│   └── types/
│       └── index.ts           # UserProfile, SwipeAction, Match types
├── components/
│   └── ui/button.tsx          # shadcn button component
├── lib/
│   └── utils.ts               # Tailwind merge utility
├── public/                    # Static assets
├── .env                       # DATABASE_URL (gitignored)
├── .gitignore
├── .npmrc
├── package.json
├── pnpm-workspace.yaml        # pnpm v12 build allowlist
├── next.config.mjs
├── tsconfig.json
└── PROJECT_CONTEXT.md         # This file
```

---

## Database Schema

### User

Represents both the demo user and all discoverable profiles.

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | Primary key |
| name | String | Display name |
| age | Int | Age in years |
| photo | String | Unsplash URL |
| bio | String | Short bio |
| city | String | Location label |
| college | String? | Optional college name |
| interests | String | JSON-encoded string array |
| createdAt | DateTime | Auto timestamp |
| updatedAt | DateTime | Auto timestamp |

> **Note on `interests`:** SQLite has no native array type. Interests are stored as a JSON string (`JSON.stringify(array)`) and parsed at the application layer. Phase 2 API routes must `JSON.parse(user.interests)` before returning to the frontend.

### Swipe

Records every swipe action from one user to another.

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | Primary key |
| fromUserId | String | FK → User.id |
| toUserId | String | FK → User.id |
| action | String | `"LIKE"` or `"PASS"` |
| createdAt | DateTime | Auto timestamp |

**Unique constraint:** `(fromUserId, toUserId)` — prevents duplicate swipes.

### Match

A mutual match between two users.

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | Primary key |
| userOneId | String | FK → User.id |
| userTwoId | String | FK → User.id |
| createdAt | DateTime | Auto timestamp |

**Unique constraint:** `(userOneId, userTwoId)` — the application must normalize ordering (always store smaller ID as `userOneId`) to prevent duplicate matches regardless of direction.

### Relationships

```
User ──(swipesSent)──► Swipe ◄──(swipesReceived)── User
User ──(matchesAsOne)──► Match ◄──(matchesAsTwo)── User
```

---

## Seed Data

### Demo User

| Field | Value |
|---|---|
| id | `demo-user-01` |
| name | Alex |
| age | 25 |
| city | New York, NY |
| college | NYU |
| bio | Adventure seeker with a love for coffee, hiking, and finding the best hidden restaurants in the city. |
| interests | Hiking, Coffee, Photography, Music |

### Mock Profiles

30 realistic profiles (profile-01 through profile-30) covering a range of names, ages (22–27), locations (Brooklyn, Manhattan, Queens, Jersey City, Hoboken), colleges and interests.

### Pre-seeded Likes (profiles who liked the demo user)

The following profiles have a LIKE swipe recorded targeting `demo-user-01`:
`profile-01` (Maya), `profile-04` (Isabella), `profile-08` (Chloe), `profile-12` (Lily), `profile-17` (Aria), `profile-23` (Jade), `profile-28` (Elena)

These will produce **mutual matches** in Phase 2 when the demo user swipes LIKE on any of these profiles.

> **Privacy rule:** These one-sided likes must NOT be exposed in the API. Only a mutual match reveals that someone liked you.

---

## Files Created or Modified

### New files
| File | Purpose |
|---|---|
| `prisma/schema.prisma` | Prisma schema with User, Swipe, Match models |
| `prisma/seed.ts` | Idempotent seed (demo user + 30 profiles + 7 pre-likes) |
| `prisma/dev.db` | SQLite database (gitignored) |
| `prisma/migrations/…/migration.sql` | Auto-generated migration SQL |
| `src/lib/db.ts` | Prisma client singleton (Next.js safe) |
| `.env` | `DATABASE_URL=file:./prisma/dev.db` |
| `.npmrc` | pnpm config |
| `PROJECT_CONTEXT.md` | This file |

### Modified files
| File | Change |
|---|---|
| `package.json` | Added Prisma/tsx deps, db:* scripts, prisma.seed config |
| `pnpm-workspace.yaml` | Set `allowBuilds` for Prisma/esbuild (pnpm v12 requirement) |
| `.gitignore` | Added `*.db`, `*.db-journal`, etc. |

### Unchanged files (frontend — do not touch)
- `src/app/**/*.tsx` — all page components
- `src/components/**/*.tsx` — DiscoverApp, ProfileCard, BottomNavigation
- `src/services/**/*.ts` — feedService, swipeService, matchService
- `src/data/**/*.ts` — mockAdapter, mockProfiles
- `src/types/index.ts` — UserProfile, SwipeAction, Match types
- `src/app/globals.css` — all styling

---

## Commands

### First-time setup

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Run migrations (creates dev.db)
pnpm db:migrate

# Seed the database
pnpm db:seed
```

### Ongoing development

```bash
# Start dev server (still uses mock data until Phase 3)
pnpm dev

# Re-generate Prisma client after schema changes
pnpm db:generate

# Create new migration after schema changes
pnpm db:migrate

# Reseed (safe to run repeatedly — idempotent)
pnpm db:seed

# Open Prisma Studio (visual DB browser)
pnpm db:studio
```

> **Note:** `pnpm db:migrate` auto-runs the seed after migration. To run only the seed, use `pnpm db:seed`.

---

## Current State (Phase 1 Complete)

### ✅ Completed
1. **Codebase audit** — Full understanding of existing types, services, mock adapter, components and swipe/match flow.
2. **Prisma + SQLite setup** — Installed `prisma@^6.3.1` and `@prisma/client@^6.3.1` using pnpm; resolved pnpm v12 build script policy (via `pnpm-workspace.yaml` `allowBuilds`).
3. **Schema** — Three models (User, Swipe, Match) with proper FK relationships, unique constraints and appropriate field types.
4. **Migration** — `20261118172331_init` applied successfully; `dev.db` created at `prisma/dev.db`.
5. **Seed** — 1 demo user + 30 profiles + 7 one-sided likes seeded. Idempotency verified (upsert throughout).
6. **Prisma client singleton** — `src/lib/db.ts` follows Next.js hot-reload best practice.
7. **TypeScript check** — `tsc --noEmit` passes with zero errors.
8. **gitignore** — `*.db` and SQLite journal files excluded.

### Verification Results
```
Total users:   31  (1 demo + 30 profiles)
Total swipes:   7  (pre-seeded likes → demo user)
Total matches:  0  (none yet — requires mutual swipe in Phase 2)
Idempotency:   ✅  (re-running seed produces identical counts)
TypeScript:    ✅  (zero errors)
```

---

## Pending Work

### Phase 2 — Backend API
- `GET /api/feed` — Return unseeded profiles excluding already-swiped ones (filtered per `demo-user-01`)
- `POST /api/swipe` — Record swipe, detect mutual match, create Match record
- `GET /api/matches` — Return confirmed mutual matches for the demo user
- Mutual matching logic: when user A swipes LIKE on B, check if B already has a LIKE on A → create Match
- Match ordering normalization: always `userOneId < userTwoId` to satisfy unique constraint
- Privacy enforcement: never expose `hasLikedMe` or unilateral likes through any API
- Validation (Zod or manual): `targetUserId` must be valid, action must be LIKE/PASS
- Error handling: 404 for unknown user, 409 for duplicate swipe, etc.

### Phase 3 — Frontend Integration
- Remove `NEXT_PUBLIC_USE_MOCK_DATA` flag or set it to `'false'` to route services to real APIs
- Update service URLs: `/feed` → `/api/feed`, `/swipe` → `/api/swipe`, `/matches` → `/api/matches`
- Verify end-to-end: swipe persistence, match detection, matches page populates from DB
- Edge cases: swiping all profiles, re-loading after refresh, duplicate match prevention
- README finalization

### Implementation Decisions for Phase 2
- **Demo user auth**: The demo user is hardcoded as `demo-user-01`. Phase 2 should use this ID server-side (no auth system required for the assignment).
- **interests JSON**: Parse `JSON.parse(user.interests)` in API route before returning to frontend. The `UserProfile` type expects `interests: string[]`.
- **location field**: The frontend `UserProfile` type uses `location` (a single string). The DB uses `city`. The API route should map `city → location`.
- **hasLikedMe field**: Must always return `false` from the API (privacy rule). Only `isMatch: true` on swipe response reveals mutual feeling.
- **Feed ordering**: Consider random shuffle or deterministic order. Exclude already-swiped profiles using a `NOT IN` subquery on Swipe.fromUserId = demo-user-01.

