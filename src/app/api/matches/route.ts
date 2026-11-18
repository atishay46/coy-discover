import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { Match } from '@/types'

const DEMO_USER_ID = 'demo-user-01'

// GET /api/matches - all confirmed mutual matches for the demo user
export async function GET() {
  try {
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

    // The "other" user is whichever side is not the demo user.
    const result: Match[] = matches.map((match) => {
      const otherUser =
        match.userOneId === DEMO_USER_ID ? match.userTwo : match.userOne

      return {
        id: match.id,
        profile: {
          id: otherUser.id,
          name: otherUser.name,
          age: otherUser.age,
          location: otherUser.city,
          bio: otherUser.bio,
          photo: otherUser.photo,
          interests: JSON.parse(otherUser.interests) as string[],
          hasLikedMe: false,
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

