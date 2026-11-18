import { NextRequest, NextResponse } from 'next/server'
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

// POST /api/swipe
// Body: { targetUserId: string, action: "LIKE" | "PASS" }
// Records the swipe and creates a Match on mutual like.
export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Request body must be an object.' }, { status: 400 })
  }

  const { targetUserId, action } = body as Record<string, unknown>

  if (typeof targetUserId !== 'string' || targetUserId.trim() === '') {
    return NextResponse.json({ error: 'targetUserId must be a non-empty string.' }, { status: 400 })
  }

  if (action !== 'LIKE' && action !== 'PASS') {
    return NextResponse.json({ error: 'action must be "LIKE" or "PASS".' }, { status: 400 })
  }

  if (targetUserId === DEMO_USER_ID) {
    return NextResponse.json({ error: 'You cannot swipe on yourself.' }, { status: 400 })
  }

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } })
  if (!targetUser) {
    return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })
  }

  const existingSwipe = await prisma.swipe.findUnique({
    where: {
      fromUserId_toUserId: {
        fromUserId: DEMO_USER_ID,
        toUserId: targetUserId,
      },
    },
  })
  if (existingSwipe) {
    return NextResponse.json(
      { error: 'You have already swiped on this profile.' },
      { status: 409 },
    )
  }

  await prisma.swipe.create({
    data: {
      fromUserId: DEMO_USER_ID,
      toUserId: targetUserId,
      action,
    },
  })

  let isMatch = false
  let matchedProfile: UserProfile | undefined

  if (action === 'LIKE') {
    const reverseSwipe = await prisma.swipe.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: targetUserId,
          toUserId: DEMO_USER_ID,
        },
      },
    })

    if (reverseSwipe?.action === 'LIKE') {
      // Normalize IDs so (A,B) and (B,A) always map to the same Match row.
      const [userOneId, userTwoId] =
        DEMO_USER_ID < targetUserId
          ? [DEMO_USER_ID, targetUserId]
          : [targetUserId, DEMO_USER_ID]

      await prisma.match.upsert({
        where: { userOneId_userTwoId: { userOneId, userTwoId } },
        update: {},
        create: { userOneId, userTwoId },
      })

      isMatch = true
      matchedProfile = toUserProfile(targetUser)
    }
  }

  return NextResponse.json({ success: true, isMatch, matchedProfile })
}

