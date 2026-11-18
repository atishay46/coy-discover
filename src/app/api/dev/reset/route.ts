import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// This endpoint is ONLY available in development.
// It resets all demo user activity and restores the original seeded incoming likes.
// Never call this from production — the guard below enforces that.

const DEMO_USER_ID = 'demo-user-01'

// Profiles that were pre-seeded to have already liked the demo user.
// Must match prisma/seed.ts PROFILES_WHO_LIKED_DEMO.
const PROFILES_WHO_LIKED_DEMO = [
  'profile-01',
  'profile-04',
  'profile-08',
  'profile-12',
  'profile-17',
  'profile-23',
  'profile-28',
]

export async function POST() {
  // Hard guard: refuse to run outside development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development.' },
      { status: 403 },
    )
  }

  // 1. Delete all matches involving the demo user
  await prisma.match.deleteMany({
    where: {
      OR: [{ userOneId: DEMO_USER_ID }, { userTwoId: DEMO_USER_ID }],
    },
  })

  // 2. Delete all swipes made BY the demo user
  await prisma.swipe.deleteMany({
    where: { fromUserId: DEMO_USER_ID },
  })

  // 3. Delete the pre-seeded incoming likes so we can re-create them cleanly
  await prisma.swipe.deleteMany({
    where: {
      toUserId: DEMO_USER_ID,
      fromUserId: { in: PROFILES_WHO_LIKED_DEMO },
    },
  })

  // 4. Re-seed the incoming likes (profiles who have already liked the demo user).
  // No skipDuplicates needed — step 3 already deleted them cleanly.
  await prisma.swipe.createMany({
    data: PROFILES_WHO_LIKED_DEMO.map((profileId) => ({
      fromUserId: profileId,
      toUserId: DEMO_USER_ID,
      action: 'LIKE' as const,
    })),
  })

  return NextResponse.json({
    success: true,
    message: 'Demo data has been reset. All swipes and matches cleared; incoming likes restored.',
    incomingLikesRestored: PROFILES_WHO_LIKED_DEMO.length,
  })
}
