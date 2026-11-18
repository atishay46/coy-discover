import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { Match } from '@/types'

// The hardcoded demo user — no auth system needed for this assignment
const DEMO_USER_ID = 'demo-user-01'

// GET /api/matches
// Returns all confirmed mutual matches for the demo user,
// shaped as the Match[] type the frontend expects.
export async function GET() {
  try {
    // Find every Match row where the demo user is either userOne or userTwo
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ userOneId: DEMO_USER_ID }, { userTwoId: DEMO_USER_ID }],
      },
      include: {
        userOne: true,
        userTwo: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Map each Match DB row to the frontend Match type.
    // The "other" user is whichever side is NOT the demo user.
    const result: Match[] = matches.map((match) => {
      const otherUser =
        match.userOneId === DEMO_USER_ID ? match.userTwo : match.userOne

      return {
        id: match.id,
        profile: {
          id: otherUser.id,
          name: otherUser.name,
          age: otherUser.age,
          location: otherUser.city,                        // city → location
          bio: otherUser.bio,
          photo: otherUser.photo,
          interests: JSON.parse(otherUser.interests) as string[],
          hasLikedMe: false,                               // privacy rule
        },
        matchedAt: match.createdAt.toISOString(),
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[GET /api/matches]', error)
    return NextResponse.json(
      { error: 'Could not load matches. Please try again.' },
      { status: 500 },
    )
  }
}

