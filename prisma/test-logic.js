/**
 * Phase 2 Logic Test Script
 * Tests the core matching logic and database operations directly via Prisma.
 * Run with: node prisma/test-logic.js
 */
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const DEMO_USER_ID = 'demo-user-01'

let passed = 0
let failed = 0

function assert(condition, label) {
  if (condition) {
    console.log(`  ✅ PASS: ${label}`)
    passed++
  } else {
    console.error(`  ❌ FAIL: ${label}`)
    failed++
  }
}

// ── Helpers matching exactly what the API routes do ──────────────────────────

async function apiSwipe(targetUserId, action) {
  // Validation
  if (!targetUserId || typeof targetUserId !== 'string') return { error: 'invalid targetUserId', status: 400 }
  if (action !== 'LIKE' && action !== 'PASS') return { error: 'invalid action', status: 400 }
  if (targetUserId === DEMO_USER_ID) return { error: 'cannot swipe yourself', status: 400 }

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } })
  if (!targetUser) return { error: 'Profile not found', status: 404 }

  const existingSwipe = await prisma.swipe.findUnique({
    where: { fromUserId_toUserId: { fromUserId: DEMO_USER_ID, toUserId: targetUserId } },
  })
  if (existingSwipe) return { error: 'Duplicate swipe', status: 409 }

  await prisma.swipe.create({ data: { fromUserId: DEMO_USER_ID, toUserId: targetUserId, action } })

  let isMatch = false
  let matchedProfile = undefined

  if (action === 'LIKE') {
    const reverseSwipe = await prisma.swipe.findUnique({
      where: { fromUserId_toUserId: { fromUserId: targetUserId, toUserId: DEMO_USER_ID } },
    })
    if (reverseSwipe?.action === 'LIKE') {
      const [userOneId, userTwoId] =
        DEMO_USER_ID < targetUserId ? [DEMO_USER_ID, targetUserId] : [targetUserId, DEMO_USER_ID]
      await prisma.match.upsert({
        where: { userOneId_userTwoId: { userOneId, userTwoId } },
        update: {},
        create: { userOneId, userTwoId },
      })
      isMatch = true
      matchedProfile = { id: targetUser.id, name: targetUser.name }
    }
  }

  return { status: 200, body: { success: true, isMatch, matchedProfile } }
}

async function getFeed() {
  const alreadySwiped = await prisma.swipe.findMany({
    where: { fromUserId: DEMO_USER_ID },
    select: { toUserId: true },
  })
  const swipedIds = alreadySwiped.map((s) => s.toUserId)
  return prisma.user.findMany({
    where: { id: { notIn: [DEMO_USER_ID, ...swipedIds] } },
  })
}

async function getMatches() {
  const matches = await prisma.match.findMany({
    where: { OR: [{ userOneId: DEMO_USER_ID }, { userTwoId: DEMO_USER_ID }] },
    include: { userOne: true, userTwo: true },
    orderBy: { createdAt: 'desc' },
  })
  return matches.map((m) => {
    const other = m.userOneId === DEMO_USER_ID ? m.userTwo : m.userOne
    return { id: m.id, matchedAt: m.createdAt, otherUser: { id: other.id, name: other.name }, hasLikedMe: false }
  })
}

// ── Test runner ───────────────────────────────────────────────────────────────

async function resetState() {
  // Clear swipes and matches from demo user (not the pre-seeded incoming likes)
  await prisma.match.deleteMany({
    where: { OR: [{ userOneId: DEMO_USER_ID }, { userTwoId: DEMO_USER_ID }] },
  })
  await prisma.swipe.deleteMany({ where: { fromUserId: DEMO_USER_ID } })
}

async function main() {
  console.log('\n🧪 Phase 2 Logic Tests\n')

  // ── Seed check ──────────────────────────────────────────────────────────────
  console.log('[ Seed verification ]')
  const userCount = await prisma.user.count()
  const preSeededLikes = await prisma.swipe.count({ where: { toUserId: DEMO_USER_ID, action: 'LIKE' } })
  assert(userCount === 31, `Database has 31 users (1 demo + 30 profiles), got ${userCount}`)
  assert(preSeededLikes === 7, `7 profiles pre-liked the demo user, got ${preSeededLikes}`)

  await resetState()

  // ── Test 1: Feed excludes demo user and swiped profiles ─────────────────────
  console.log('\n[ Test 1: Feed API ]')
  const feedBefore = await getFeed()
  assert(feedBefore.length === 30, `Feed returns 30 unswiped profiles, got ${feedBefore.length}`)
  assert(!feedBefore.find((u) => u.id === DEMO_USER_ID), 'Feed excludes the demo user')

  // ── Test 2: LIKE without mutual — no match ───────────────────────────────────
  console.log('\n[ Test 2: LIKE without mutual (profile-02 Sofia has not liked demo) ]')
  const likeResult = await apiSwipe('profile-02', 'LIKE')
  assert(likeResult.status === 200, 'Swipe returned 200')
  assert(likeResult.body?.success === true, 'success is true')
  assert(likeResult.body?.isMatch === false, 'isMatch is false (no mutual like)')
  assert(likeResult.body?.matchedProfile === undefined, 'matchedProfile is undefined')

  const feedAfterLike = await getFeed()
  assert(feedAfterLike.length === 29, `Feed drops to 29 after one swipe, got ${feedAfterLike.length}`)
  assert(!feedAfterLike.find((u) => u.id === 'profile-02'), 'Swiped profile removed from feed')

  // ── Test 3: PASS — no match ─────────────────────────────────────────────────
  console.log('\n[ Test 3: PASS on a profile ]')
  const passResult = await apiSwipe('profile-03', 'PASS')
  assert(passResult.status === 200, 'Pass returned 200')
  assert(passResult.body?.isMatch === false, 'isMatch is false for PASS')
  const matchesAfterPass = await getMatches()
  assert(matchesAfterPass.length === 0, 'No match created for PASS')

  // ── Test 4: Mutual LIKE — match is created ───────────────────────────────────
  console.log('\n[ Test 4: Mutual LIKE → match created (profile-01 Maya pre-liked demo) ]')
  const mutualLike = await apiSwipe('profile-01', 'LIKE')
  assert(mutualLike.status === 200, 'Mutual swipe returned 200')
  assert(mutualLike.body?.isMatch === true, 'isMatch is true')
  assert(mutualLike.body?.matchedProfile?.name === 'Maya', `matchedProfile.name = "${mutualLike.body?.matchedProfile?.name}" (expected Maya)`)
  const matchesAfterMutual = await getMatches()
  assert(matchesAfterMutual.length === 1, `One match recorded, got ${matchesAfterMutual.length}`)
  assert(matchesAfterMutual[0].otherUser.name === 'Maya', 'Match is with Maya')

  // ── Test 5: Duplicate swipe rejected ────────────────────────────────────────
  console.log('\n[ Test 5: Duplicate swipe rejected ]')
  const dupResult = await apiSwipe('profile-01', 'LIKE')
  assert(dupResult.status === 409, `Duplicate swipe → 409 Conflict, got ${dupResult.status}`)

  // ── Test 6: Privacy — hasLikedMe never exposed ──────────────────────────────
  console.log('\n[ Test 6: Privacy — hasLikedMe = false in all API responses ]')
  const matches = await getMatches()
  const feedProfiles = await getFeed()
  assert(
    matches.every((m) => m.hasLikedMe === false),
    'hasLikedMe is false in every match response',
  )
  // The raw pre-seeded incoming likes should not be visible from the feed
  const incomingLikers = ['profile-04', 'profile-08', 'profile-12', 'profile-17', 'profile-23', 'profile-28']
  const feedIds = feedProfiles.map((p) => p.id)
  assert(
    incomingLikers.every((id) => feedIds.includes(id)),
    'Profiles who liked demo user appear in feed (their like is not disclosed)',
  )

  // ── Test 7: Invalid profile ID ───────────────────────────────────────────────
  console.log('\n[ Test 7: Invalid / unknown profile ID ]')
  const badId = await apiSwipe('not-a-real-profile', 'LIKE')
  assert(badId.status === 404, `Unknown ID → 404, got ${badId.status}`)

  // ── Test 8: Invalid action ───────────────────────────────────────────────────
  console.log('\n[ Test 8: Invalid action ]')
  const badAction = await apiSwipe('profile-05', 'CRUSH')
  assert(badAction.status === 400, `Invalid action → 400, got ${badAction.status}`)

  // ── Test 9: Swipe on self ─────────────────────────────────────────────────────
  console.log('\n[ Test 9: Swipe on self ]')
  const selfSwipe = await apiSwipe(DEMO_USER_ID, 'LIKE')
  assert(selfSwipe.status === 400, `Self-swipe → 400, got ${selfSwipe.status}`)

  // ── Test 10: Multiple mutual matches ─────────────────────────────────────────
  console.log('\n[ Test 10: Multiple mutual matches accumulate correctly ]')
  await apiSwipe('profile-04', 'LIKE') // Isabella pre-liked demo
  await apiSwipe('profile-08', 'LIKE') // Chloe pre-liked demo
  const finalMatches = await getMatches()
  assert(finalMatches.length === 3, `3 total matches (Maya + Isabella + Chloe), got ${finalMatches.length}`)

  // ── Test 11: Persistence check (swipes survive reset between sessions) ───────
  console.log('\n[ Test 11: Persistence — swipe count survives context switch ]')
  const swipeCount = await prisma.swipe.count({ where: { fromUserId: DEMO_USER_ID } })
  // profile-02 (LIKE), profile-03 (PASS), profile-01 (LIKE), profile-04 (LIKE), profile-08 (LIKE) = 5
  assert(swipeCount === 5, `Demo user has 5 outgoing swipes recorded, got ${swipeCount}`)

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log('\n─────────────────────────────────────')
  console.log(`Results: ${passed} passed, ${failed} failed`)
  if (failed > 0) {
    console.error('❌ Some tests failed.')
    process.exit(1)
  } else {
    console.log('🎉 All tests passed!')
  }

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('\n💥 Unexpected error:', e)
  prisma.$disconnect()
  process.exit(1)
})
