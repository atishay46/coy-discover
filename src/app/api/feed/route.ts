import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { UserProfile } from '@/types'

// The hardcoded demo user — no auth system needed for this assignment
const DEMO_USER_ID = 'demo-user-01'

// Helper: convert a DB User row to the UserProfile shape the frontend expects
function toUserProfile(user: {
  id: string
  name: string
  age: number
  photo: string
  bio: string
  city: string
  interests: string
}): UserProfile {
  return {
    id: user.id,
    name: user.name,
    age: user.age,
    location: user.city,              // DB stores "city"; frontend expects "location"
    bio: user.bio,
    photo: user.photo,
    interests: JSON.parse(user.interests) as string[],
    hasLikedMe: false,                // Never expose one-sided likes (privacy rule)
  }
}

// GET /api/feed
// Returns all profiles that the demo user has NOT yet swiped on.
export async function GET() {
  try {
    // Find the IDs of every profile the demo user has already swiped
    const alreadySwiped = await prisma.swipe.findMany({
      where: { fromUserId: DEMO_USER_ID },
      select: { toUserId: true },
    })
    const swipedIds = alreadySwiped.map((s) => s.toUserId)

    // Return all users except the demo user itself and already-swiped profiles
    const profiles = await prisma.user.findMany({
      where: {
        id: { notIn: [DEMO_USER_ID, ...swipedIds] },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ profiles: profiles.map(toUserProfile) })
  } catch (error) {
    console.error('[GET /api/feed]', error)
    return NextResponse.json(
      { error: 'Could not load profiles. Please try again.' },
      { status: 500 },
    )
  }
}

