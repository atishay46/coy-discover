import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { UserProfile } from '@/types'

const DEMO_USER_ID = 'demo-user-01'

// Maps a DB User row to the shape the frontend expects.
// city -> location; interests JSON string -> array; hasLikedMe always false (privacy rule).
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
    location: user.city,
    bio: user.bio,
    photo: user.photo,
    interests: JSON.parse(user.interests) as string[],
    hasLikedMe: false,
  }
}

// GET /api/feed - profiles the demo user has not yet swiped on
export async function GET() {
  try {
    const alreadySwiped = await prisma.swipe.findMany({
      where: { fromUserId: DEMO_USER_ID },
      select: { toUserId: true },
    })
    const swipedIds = alreadySwiped.map((s) => s.toUserId)

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

