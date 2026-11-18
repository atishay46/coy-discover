# PROJECT_CONTEXT.md — Coy Discover

> Last updated: **Phase 3 complete — application fully integrated and verified** (2026-11-18)

---

## Project Objective

Build a standalone **Coy Discover** dating-app feature as a full-stack technical assignment.

Starting from an existing Next.js frontend with mock data and in-memory state, the goal was to convert it into a fully persistent application backed by **Prisma + SQLite** without redesigning the existing UI.

**All three phases are complete.** The application now reads and writes all data through real API routes, persists across page refreshes and server restarts, and correctly handles matching, privacy, and edge cases.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.4.6 |
| UI | React | ^19 |
| Language | TypeScript | 5.7.3 |
| Styling | Tailwind CSS | ^4.3.3 |
| Animations | Framer Motion | ^14.14.0 |
| Icons | Lucide React | ^1.16.0 |
| ORM | Prisma | 6.19.3 |
| Database | SQLite (local dev) | via Prisma datasource |
| DB client | @prisma/client | 6.19.3 |
| Seed runner | tsx | ^4.19.3 |
| Package manager | pnpm | 12.3.4 |

---

## Final Project Structure

```
project/
├── prisma/
│   ├── schema.prisma                      # DB schema: User, Swipe, Match
│   ├── seed.ts                            # Idempotent seed (tsx)
│   ├── test-logic.js                      # 26-case logic test suite
│   ├── dev.db                             # SQLite database (gitignored)
│   └── migrations/
│       └── 20261118172331_init/
│           └── migration.sql
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── feed/route.ts              # GET /api/feed
│   │   │   ├── swipe/route.ts             # POST /api/swipe
│   │   │   └── matches/route.ts           # GET /api/matches
│   │   ├── layout.tsx
│   │   ├── page.tsx                       # Root → DiscoverApp
│   │   ├── discover/page.tsx
│   │   ├── home/page.tsx
│   │   └── matches/page.tsx
│   ├── components/
│   │   ├── DiscoverApp.tsx                # Swipe UI + match celebration
│   │   ├── ProfileCard.tsx                # Draggable card (Framer Motion)
│   │   └── BottomNavigation.tsx
│   ├── data/
│   │   ├── mockAdapter.ts                 # (retained, unused at runtime)
│   │   └── mockProfiles.ts               # (retained, unused at runtime)
│   ├── lib/
│   │   └── db.ts                          # Prisma singleton
│   ├── services/
│   │   ├── feedService.ts                 # → GET /api/feed
│   │   ├── swipeService.ts                # → POST /api/swipe
│   │   └── matchService.ts                # → GET /api/matches
│   └── types/
│       └── index.ts
├── components/ui/button.tsx
├── lib/utils.ts
├── public/
├── .env                                   # DATABASE_URL (gitignored)
├── .gitignore
├── .npmrc
├── package.json
├── pnpm-workspace.yaml
├── next.config.mjs
├── tsconfig.json
├── README.md
└── PROJECT_CONTEXT.md
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
| city | String | Location label (mapped → `location` in API) |
| college | String? | Optional |
| interests | String | JSON-encoded string array |
| createdAt | DateTime | Auto timestamp |
| updatedAt | DateTime | Auto timestamp |

### Swipe

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | Primary key |
| fromUserId | String | FK → User.id |
| toUserId | String | FK → User.id |
| action | String | `"LIKE"` or `"PASS"` |
| createdAt | DateTime | Auto timestamp |

**Unique constraint:** `(fromUserId, toUserId)`

### Match

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | Primary key |
| userOneId | String | FK → User.id (always lexicographically smaller) |
| userTwoId | String | FK → User.id (always lexicographically larger) |
| createdAt | DateTime | Auto timestamp |

**Unique constraint:** `(userOneId, userTwoId)` — IDs are normalized at write time.

---

## API Endpoints

### `GET /api/feed`

Returns all profiles the demo user has **not yet swiped on**.

- Excludes `demo-user-01`
- Excludes already-swiped profiles (looks up `Swipe` table where `fromUserId = demo-user-01`)
- Ordered alphabetically by name
- `hasLikedMe` is always `false`

**Response:** `{ profiles: UserProfile[] }`

---

### `POST /api/swipe`

Records a swipe. If action is LIKE and the target already liked the demo user, creates a Match.

**Body:** `{ targetUserId: string, action: "LIKE" | "PASS" }`

**Validation:** 400 (bad input), 404 (unknown profile), 409 (duplicate swipe)

**Matching logic:**
1. Create Swipe record
2. If LIKE: check for reverse LIKE swipe (`target → demo-user-01`)
3. If mutual: normalize IDs (`min` → `userOneId`, `max` → `userTwoId`), upsert Match

**Response:** `{ success: true, isMatch: boolean, matchedProfile?: UserProfile }`

---

### `GET /api/matches`

Returns all confirmed mutual matches for the demo user, newest first.

**Response:** `Match[]` where `Match = { id, profile: UserProfile, matchedAt: string }`

---

## Privacy Rules

1. `hasLikedMe` is always `false` in every API response
2. No endpoint exposes one-sided incoming likes
3. `isMatch: true` is the only signal of mutual interest, returned only at the moment it becomes mutual
4. `DEMO_USER_ID` is a server-side constant — never read from the request

---

## Seed Data

| Field | Value |
|---|---|
| Demo user id | `demo-user-01` |
| Demo user name | Alex |
| Demo user city | New York, NY |
| Total profiles | 30 (profile-01 through profile-30) |
| Pre-seeded likes → demo | 7 profiles |

**Profiles who have already liked Alex** (swipe LIKE on these to trigger a match):
- `profile-01` Maya, `profile-04` Isabella, `profile-08` Chloe, `profile-12` Lily
- `profile-17` Aria, `profile-23` Jade, `profile-28` Elena

---

## Commands

```bash
# Install dependencies
pnpm install

# First-time database setup (migrate + seed)
pnpm db:migrate

# Reset database to clean seeded state
pnpm db:reset

# Seed only (without migration)
pnpm db:seed

# Start development server
pnpm dev

# Run production build
pnpm build

# Run logic test suite
pnpm test

# Open Prisma Studio
pnpm db:studio
```

---

## Files Created or Modified by Phase

### Phase 1 — Database Foundation
| File | Action | Notes |
|---|---|---|
| `prisma/schema.prisma` | Created | User, Swipe, Match models |
| `prisma/seed.ts` | Created | Demo user + 30 profiles + 7 pre-likes |
| `prisma/migrations/…/migration.sql` | Created | Auto-generated by Prisma |
| `src/lib/db.ts` | Created | Prisma singleton (Next.js hot-reload safe) |
| `.env` | Created | `DATABASE_URL=file:./dev.db` |
| `.npmrc` | Created | pnpm config |
| `package.json` | Modified | Added Prisma deps, db:* scripts |
| `pnpm-workspace.yaml` | Modified | `allowBuilds` for Prisma/esbuild (pnpm v12) |
| `.gitignore` | Modified | Added `*.db` entries |

### Phase 2 — Backend API
| File | Action | Notes |
|---|---|---|
| `src/app/api/feed/route.ts` | Created | `GET /api/feed` |
| `src/app/api/swipe/route.ts` | Created | `POST /api/swipe` |
| `src/app/api/matches/route.ts` | Created | `GET /api/matches` |
| `prisma/test-logic.js` | Created | 26-case test suite |

### Phase 3 — Frontend Integration
| File | Action | Notes |
|---|---|---|
| `src/services/feedService.ts` | Modified | Calls `GET /api/feed` directly; mock removed |
| `src/services/swipeService.ts` | Modified | Calls `POST /api/swipe` directly; mock removed |
| `src/services/matchService.ts` | Modified | Calls `GET /api/matches` directly; mock removed |
| `README.md` | Created | Full project documentation |
| `package.json` | Modified | Added `db:reset` and `test` scripts |
| `PROJECT_CONTEXT.md` | Modified | Updated for Phase 3 (this file) |

### Never modified (preserved exactly)
- `src/app/**/*.tsx` — all page components
- `src/components/**/*.tsx` — DiscoverApp, ProfileCard, BottomNavigation
- `src/types/index.ts` — shared TypeScript types
- `src/app/globals.css` — all styling
- `src/data/mockAdapter.ts`, `src/data/mockProfiles.ts` — retained but no longer called at runtime

---

## Verification Results (Phase 3)

### TypeScript
```
tsc --noEmit → 0 errors
```

### Production build
```
next build → compiled successfully
Routes: / ○, /discover ○, /home ○, /matches ○
         /api/feed ƒ, /api/swipe ƒ, /api/matches ƒ
```

### Logic tests (`pnpm test` / `node prisma/test-logic.js`)
```
26 passed, 0 failed
```

### End-to-end HTTP tests (dev server)
```
GET  /api/feed                         → 200, 30 profiles, hasLikedMe=false  ✅
POST /api/swipe { profile-02, PASS }   → 200, isMatch=false                  ✅
POST /api/swipe { profile-03, LIKE }   → 200, isMatch=false (no mutual)      ✅
POST /api/swipe { profile-01, LIKE }   → 200, isMatch=true, name=Maya        ✅
GET  /api/matches                      → 200, 1 match, profile=Maya           ✅
POST /api/swipe { profile-01, LIKE }   → 409 Conflict (duplicate)             ✅
POST /api/swipe { does-not-exist }     → 404 Not Found                        ✅
GET  /api/feed (after 3 swipes)        → 200, 27 profiles                     ✅
Privacy: Isabella in feed, hasLikedMe=false (pre-liked, not disclosed)        ✅
```

### Assignment checklist

| Requirement | Status |
|---|---|
| Feed loads profiles from database | ✅ |
| Like action recorded in DB | ✅ |
| Pass action recorded in DB | ✅ |
| Mutual like creates a match | ✅ |
| One-sided likes never exposed | ✅ |
| Already-swiped profiles never reappear | ✅ |
| Match celebration overlay shown | ✅ |
| Matches page shows mutual matches | ✅ |
| Data persists after page refresh | ✅ |
| Data persists after server restart | ✅ |
| Duplicate swipe rejected (409) | ✅ |
| Invalid profile ID rejected (404) | ✅ |
| Invalid action rejected (400) | ✅ |
| Empty feed state handled | ✅ |
| Error state with retry handled | ✅ |
| Loading state shown | ✅ |
| TypeScript passes with zero errors | ✅ |
| Production build succeeds | ✅ |
| Existing design and animations preserved | ✅ |
| No unnecessary dependencies added | ✅ |

---

## Architecture Summary

```
Browser (React)
  │
  ├─ feedService    ──→  GET  /api/feed      ──→  Prisma → SQLite
  ├─ swipeService   ──→  POST /api/swipe     ──→  Prisma → SQLite
  └─ matchService   ──→  GET  /api/matches   ──→  Prisma → SQLite
```

The frontend never touches the database directly. All persistence goes through the Next.js API routes, which use Prisma with a single shared SQLite file (`prisma/dev.db`).
