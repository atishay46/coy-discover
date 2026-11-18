import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Dev-only endpoint. Clears all demo user swipes and matches, then restores
// the pre-seeded incoming likes so the app is back to its initial state.
// Blocked in production via the NODE_ENV guard below.

const DEMO_USER_ID = 'demo-user-01'

// Must match PROFILES_WHO_LIKED_DEMO in prisma/seed.ts
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
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development.' },
      { status: 403 },
    )
  }

  await prisma.match.deleteMany({
    where: {
      OR: [{ userOneId: DEMO_USER_ID }, { userTwoId: DEMO_USER_ID }],
    },
  })

  await prisma.swipe.deleteMany({
    where: { fromUserId: DEMO_USER_ID },
  })

  // Delete then re-create so incoming likes are always in a clean state.
  await prisma.swipe.deleteMany({
    where: {
      toUserId: DEMO_USER_ID,
      fromUserId: { in: PROFILES_WHO_LIKED_DEMO },
    },
  })

  await prisma.swipe.createMany({
    data: PROFILES_WHO_LIKED_DEMO.map((profileId) => ({
      fromUserId: profileId,
      toUserId: DEMO_USER_ID,
      action: 'LIKE' as const,
    })),
  })

  return NextResponse.json({
    success: true,
    message: 'Demo data reset. Swipes and matches cleared; incoming likes restored.',
    incomingLikesRestored: PROFILES_WHO_LIKED_DEMO.length,
  })
}

