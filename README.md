# Coy Discover

A dating app discovery feature built as a full-stack assignment. Swipe through profiles, create mutual matches, and view your connections — all backed by a persistent SQLite database.

---

## Features

- **Swipe cards** — drag right to like, drag left to pass (or use the buttons)
- **Mutual matching** — a match is only created when both sides like each other
- **Private likes** — one-sided likes are never exposed; only a mutual match reveals them
- **Persistent data** — swipes and matches survive page refreshes and server restarts
- **Match celebration** — animated overlay appears instantly when a mutual match occurs
- **Matches page** — browse all confirmed matches with profile details

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.4.6 (App Router) |
| UI | React 19, TypeScript 5.7 |
| Styling | Tailwind CSS 4, Framer Motion 14 |
| ORM | Prisma 6 |
| Database | SQLite (local file) |
| Package manager | pnpm 12 |

---

## Project Structure

```
project/
├── prisma/
│   ├── schema.prisma          # Database schema (User, Swipe, Match)
│   ├── seed.ts                # Seed script — demo user + 30 profiles
│   ├── test-logic.js          # API logic and edge-case tests
│   └── migrations/            # Prisma migration history
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── feed/route.ts    # GET /api/feed
│   │   │   ├── swipe/route.ts   # POST /api/swipe
│   │   │   └── matches/route.ts # GET /api/matches
│   │   ├── discover/page.tsx    # Discover page
│   │   ├── matches/page.tsx     # Matches page
│   │   └── home/page.tsx        # Home page
│   ├── components/
│   │   ├── DiscoverApp.tsx      # Main swipe UI with match celebration
│   │   ├── ProfileCard.tsx      # Draggable swipe card (Framer Motion)
│   │   └── BottomNavigation.tsx # Tab bar navigation
│   ├── services/
│   │   ├── feedService.ts       # Calls GET /api/feed
│   │   ├── swipeService.ts      # Calls POST /api/swipe
│   │   └── matchService.ts      # Calls GET /api/matches
│   ├── lib/
│   │   └── db.ts                # Prisma client singleton
│   └── types/
│       └── index.ts             # Shared TypeScript types
└── package.json
```

---

## Setup

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)

### Install dependencies

```bash
pnpm install
```

### Environment

Create a `.env` file in the project root (already included):

```
DATABASE_URL="file:./dev.db"
```

### Database setup

```bash
# Run migrations and seed in one step
pnpm db:migrate
```

This creates the SQLite database at `prisma/dev.db`, applies the schema, and seeds it with 31 users (1 demo + 30 profiles) and 7 pre-seeded likes.

To reset and reseed from scratch:

```bash
pnpm db:reset
```

### Run the app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Available Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start the development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start the production server |
| `pnpm db:migrate` | Apply migrations and seed the database |
| `pnpm db:seed` | Seed only (without migration) |
| `pnpm db:generate` | Regenerate Prisma client after schema changes |
| `pnpm db:studio` | Open Prisma Studio (visual DB browser) |

---

## API Reference

### `GET /api/feed`

Returns profiles the demo user has not yet swiped on.

**Response:**
```json
{
  "profiles": [
    {
      "id": "profile-01",
      "name": "Maya",
      "age": 24,
      "location": "Brooklyn, NY",
      "bio": "Collecting little moments and very big playlists.",
      "photo": "https://images.unsplash.com/...",
      "interests": ["Film photos", "Sunday markets", "Indie music"],
      "hasLikedMe": false
    }
  ]
}
```

---

### `POST /api/swipe`

Records a swipe. Creates a match if both users have liked each other.

**Request body:**
```json
{ "targetUserId": "profile-01", "action": "LIKE" }
```

`action` must be `"LIKE"` or `"PASS"`.

**Response (no match):**
```json
{ "success": true, "isMatch": false }
```

**Response (mutual match):**
```json
{
  "success": true,
  "isMatch": true,
  "matchedProfile": { "id": "profile-01", "name": "Maya", ... }
}
```

**Error responses:**

| Status | Reason |
|---|---|
| 400 | Missing/invalid fields, or swiping on yourself |
| 404 | Profile not found |
| 409 | Already swiped on this profile |

---

### `GET /api/matches`

Returns all confirmed mutual matches for the demo user.

**Response:**
```json
[
  {
    "id": "match-id",
    "matchedAt": "2026-11-18T17:30:00.000Z",
    "profile": { "id": "profile-01", "name": "Maya", ... }
  }
]
```

---

## Demo

The app runs as a single demo user (**Alex**). The database is pre-seeded with 30 profiles and 7 profiles who have already liked Alex:

| Profile | Pre-liked Alex? |
|---|---|
| Maya | ✅ Swipe LIKE → instant match |
| Isabella | ✅ Swipe LIKE → instant match |
| Chloe | ✅ Swipe LIKE → instant match |
| Lily | ✅ Swipe LIKE → instant match |
| Aria | ✅ Swipe LIKE → instant match |
| Jade | ✅ Swipe LIKE → instant match |
| Elena | ✅ Swipe LIKE → instant match |

Swipe LIKE on any of the above to trigger the match celebration. All other profiles will produce a one-sided like (no match).

---

## Database Schema

```
User        — id, name, age, photo, bio, city, college, interests (JSON), timestamps
Swipe       — fromUserId → User, toUserId → User, action (LIKE/PASS), unique(from,to)
Match       — userOneId → User, userTwoId → User, unique(one,two) with normalized ordering
```

---

## Privacy Design

- `hasLikedMe` is always `false` in every API response
- No endpoint reveals one-sided incoming likes
- The demo user ID (`demo-user-01`) is a server-side constant — never read from the client
- Only `isMatch: true` in the swipe response reveals mutual interest, and only at the moment it becomes mutual

