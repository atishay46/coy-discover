import { NextRequest, NextResponse } from 'next/server'
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
    location: user.city,
    bio: user.bio,
    photo: user.photo,
    interests: JSON.parse(user.interests) as string[],
    hasLikedMe: false, // Never expose one-sided likes (privacy rule)
  }
}

// POST /api/swipe
// Body: { targetUserId: string, action: "LIKE" | "PASS" }
// Records the swipe, then checks for a mutual like to create a Match.
export async function POST(request: NextRequest) {
  // --- 1. Parse and validate the request body ---
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

  // --- 2. Prevent swiping on yourself ---
  if (targetUserId === DEMO_USER_ID) {
    return NextResponse.json({ error: 'You cannot swipe on yourself.' }, { status: 400 })
  }

  // --- 3. Confirm the target profile exists ---
  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } })
  if (!targetUser) {
    return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })
  }

  // --- 4. Reject duplicate swipes ---
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

  // --- 5. Record the swipe ---
  await prisma.swipe.create({
    data: {
      fromUserId: DEMO_USER_ID,
      toUserId: targetUserId,
      action,
    },
  })

  // --- 6. Check for a mutual like (only relevant when action is LIKE) ---
  let isMatch = false
  let matchedProfile: UserProfile | undefined

  if (action === 'LIKE') {
    // Did the target user already LIKE the demo user?
    const reverseSwipe = await prisma.swipe.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: targetUserId,
          toUserId: DEMO_USER_ID,
        },
      },
    })

    if (reverseSwipe?.action === 'LIKE') {
      // It's a mutual like — create a Match record.
      // Normalize ordering so (A,B) and (B,A) always produce the same row,
      // satisfying the unique constraint on (userOneId, userTwoId).
      const [userOneId, userTwoId] =
        DEMO_USER_ID < targetUserId
          ? [DEMO_USER_ID, targetUserId]
          : [targetUserId, DEMO_USER_ID]

      await prisma.match.upsert({
        where: { userOneId_userTwoId: { userOneId, userTwoId } },
        update: {}, // already exists — no changes needed
        create: { userOneId, userTwoId },
      })

      isMatch = true
      matchedProfile = toUserProfile(targetUser)
    }
  }

  return NextResponse.json({ success: true, isMatch, matchedProfile })
}

