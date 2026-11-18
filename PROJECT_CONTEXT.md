# PROJECT_CONTEXT.md — Coy Discover

> Last updated: **Phase 2 complete** (2026-11-18)

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
│   ├── test-logic.js          # Phase 2 logic + edge-case test suite
│   ├── dev.db                 # SQLite database (gitignored)
│   └── migrations/
│       └── 20261118172331_init/
│           └── migration.sql  # Initial schema migration
├── src/
│   ├── app/
│   │   ├── api/               # ← NEW in Phase 2
│   │   │   ├── feed/route.ts    # GET /api/feed
│   │   │   ├── swipe/route.ts   # POST /api/swipe
│   │   │   └── matches/route.ts # GET /api/matches
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
│   │   └── db.ts              # Prisma client singleton
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

## API Endpoints (Phase 2)

### `GET /api/feed`

Returns all profiles the demo user has **not yet swiped on**.

- Excludes `demo-user-01` from results
- Excludes any profile the demo user already has a Swipe record for
- Returns profiles ordered alphabetically by name
- `hasLikedMe` is always `false` (privacy rule)

**Response:** `{ profiles: UserProfile[] }`

---

### `POST /api/swipe`

Records a swipe action and detects mutual matches.

**Request body:** `{ targetUserId: string, action: "LIKE" | "PASS" }`

**Validation:**
- `targetUserId` must be a non-empty string
- `action` must be exactly `"LIKE"` or `"PASS"`
- Cannot swipe on `demo-user-01` (self)
- Target profile must exist in the database (404 if not)
- Duplicate swipes are rejected (409 Conflict)

**Matching logic:**
1. Record the swipe (`fromUserId = demo-user-01`, `toUserId = targetUserId`, `action`)
2. If `action === "LIKE"`, check whether `targetUserId` has an existing LIKE swipe directed at `demo-user-01`
3. If mutual: normalize IDs (`min(a,b)` → `userOneId`, `max(a,b)` → `userTwoId`) and upsert a Match record
4. Return `{ success: true, isMatch: boolean, matchedProfile?: UserProfile }`

**Response on success:** `{ success: true, isMatch: false }` or `{ success: true, isMatch: true, matchedProfile: UserProfile }`  
**Error responses:** 400 (validation), 404 (profile not found), 409 (duplicate)

---

### `GET /api/matches`

Returns all confirmed mutual matches for the demo user.

- Queries Match rows where `userOneId = demo-user-01` OR `userTwoId = demo-user-01`
- Resolves the "other" user from the match row
- Returns newest matches first (`orderBy: createdAt desc`)
- `hasLikedMe` is always `false` on returned profiles

**Response:** `Match[]` where `Match = { id, profile: UserProfile, matchedAt: string }`

---

## Privacy Rules

1. **`hasLikedMe` is always `false`** in every API response — the feed, swipe response, and matches list never disclose who liked whom unilaterally.
2. **One-sided incoming likes are not queryable** — there is no API endpoint that exposes which profiles liked the demo user.
3. **Only a mutual match reveals interest** — `isMatch: true` in the swipe response is the only signal, and it appears only in the moment of mutual confirmation.
4. **The demo user ID is set server-side** — `DEMO_USER_ID` is a constant in each route file, never read from the request body or query string.

---

## Data Mapping (DB → Frontend)

| DB field | Frontend field | Notes |
|---|---|---|
| `user.city` | `location` | Frontend `UserProfile` uses `location` |
| `user.interests` (JSON string) | `interests` (string[]) | `JSON.parse()` applied in route |
| — | `hasLikedMe: false` | Hardcoded; never derived from DB |
| `match.createdAt.toISOString()` | `matchedAt` | ISO string as expected by `Match` type |

---

## Files Created or Modified

### New files (Phase 2)
| File | Purpose |
|---|---|
| `src/app/api/feed/route.ts` | `GET /api/feed` — returns unswiped profiles |
| `src/app/api/swipe/route.ts` | `POST /api/swipe` — records swipe, detects match |
| `src/app/api/matches/route.ts` | `GET /api/matches` — returns mutual matches |
| `prisma/test-logic.js` | 26-case logic and edge-case test suite |

### Modified files (Phase 2)
| File | Change |
|---|---|
| `PROJECT_CONTEXT.md` | Updated for Phase 2 (this file) |

### Unchanged files (do not touch)
- All frontend pages, components, services, types and CSS — untouched
- `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/db.ts` — untouched
- `package.json`, `pnpm-workspace.yaml`, `.gitignore` — untouched

---

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

## Current State (Phase 2 Complete)

### ✅ Completed

**Phase 1:**
1. Codebase audit — full understanding of existing architecture.
2. Prisma + SQLite setup — `prisma@6.19.3`, `@prisma/client@6.19.3`.
3. Schema — User, Swipe, Match with FKs and unique constraints.
4. Migration `20261118172331_init` applied; `dev.db` at `prisma/dev.db`.
5. Seed — 1 demo user + 30 profiles + 7 pre-seeded incoming LIKE swipes.
6. Prisma client singleton at `src/lib/db.ts`.

**Phase 2:**
7. `GET /api/feed` — returns unswiped profiles, excludes demo user and already-swiped.
8. `POST /api/swipe` — validates input, records swipe, detects and creates mutual Match.
9. `GET /api/matches` — returns confirmed matches with other-user profile data.
10. Matching logic — mutual-LIKE detection, normalized ID ordering, `upsert` for safety.
11. Privacy enforcement — `hasLikedMe: false` everywhere, demo user ID is server-side only.
12. Input validation — missing fields (400), unknown profile (404), duplicate swipe (409).
13. TypeScript — zero `tsc --noEmit` errors across all routes.
14. Test suite — 26/26 assertions pass (Prisma-level + HTTP-level verification).

### Verification Results

**Logic tests (Prisma-level, `node prisma/test-logic.js`):**
```
26 passed, 0 failed
```

**HTTP tests (against running dev server):**
```
GET  /api/feed                              → 200, 30 profiles, hasLikedMe=false ✅
POST /api/swipe  { profile-01, LIKE }       → 200, isMatch=true, matchedName=Maya ✅
GET  /api/matches                           → 200, 1 match, profile=Maya ✅
POST /api/swipe  { profile-01, LIKE } again → 409 Conflict (duplicate) ✅
POST /api/swipe  { fake-id, LIKE }          → 404 Not Found ✅
```

**TypeScript:** ✅ zero errors

---

## Pending Work

### Phase 3 — Frontend Integration

The existing services (`feedService`, `swipeService`, `matchService`) still route to the mock adapter when `NEXT_PUBLIC_USE_MOCK_DATA !== 'false'`. The API routes are ready; the frontend just needs to be pointed at them.

**Tasks:**

1. **Switch services to real API**
   - In each service file, update the non-mock path URLs:
     - `feedService.ts`: `/feed` → `/api/feed`
     - `swipeService.ts`: `/swipe` → `/api/swipe`
     - `matchService.ts`: `/matches` → `/api/matches`
   - Set `NEXT_PUBLIC_USE_MOCK_DATA=false` in `.env` (or remove the mock flag logic entirely)

2. **End-to-end verification**
   - Swipe cards in browser → verify swipes persist in DB after page refresh
   - Swipe LIKE on Maya (profile-01, pre-liked demo) → match celebration modal appears
   - Navigate to `/matches` → Maya appears in match list from real DB
   - Restart dev server → matches and swipe history survive

3. **Edge cases**
   - Swipe all 30 profiles → "all caught up" empty state shows
   - Return to discover after swiping all → feed stays empty
   - Confirm no match for PASS even on pre-liked profiles

4. **README finalization**
   - Add setup instructions, project description and screenshots

