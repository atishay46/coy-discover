import { mockProfiles } from './mockProfiles'
import type { Match, SwipeAction, UserProfile } from '@/types'

const SWIPES_KEY = 'coy-demo-swipes'
const MATCHES_KEY = 'coy-demo-matches'
let swipedIds = new Set<string>()
let savedMatches: Match[] = []

function readSwipedIds() {
  if (typeof window === 'undefined') return swipedIds
  try { return new Set<string>(JSON.parse(window.sessionStorage.getItem(SWIPES_KEY) ?? '[]') as string[]) } catch { return swipedIds }
}

function readMatches() {
  if (typeof window === 'undefined') return savedMatches
  try { return JSON.parse(window.sessionStorage.getItem(MATCHES_KEY) ?? '[]') as Match[] } catch { return savedMatches }
}

function saveState(ids: Set<string>, matches: Match[]) {
  swipedIds = ids
  savedMatches = matches
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(SWIPES_KEY, JSON.stringify([...ids]))
    window.sessionStorage.setItem(MATCHES_KEY, JSON.stringify(matches))
  }
}

export const mockAdapter = {
  async getFeed(): Promise<UserProfile[]> {
    await new Promise((resolve) => setTimeout(resolve, 180))
    const ids = readSwipedIds()
    return mockProfiles.filter((profile) => !ids.has(profile.id))
  },
  async submitSwipe(targetUserId: string, action: SwipeAction) {
    await new Promise((resolve) => setTimeout(resolve, 160))
    const ids = readSwipedIds()
    const matches = readMatches()
    if (ids.has(targetUserId)) return { success: false, isMatch: false }
    ids.add(targetUserId)
    const profile = mockProfiles.find((item) => item.id === targetUserId)
    const isMatch = action === 'LIKE' && Boolean(profile?.hasLikedMe)
    if (isMatch && profile) matches.unshift({ id: `match-${profile.id}`, profile, matchedAt: new Date().toISOString() })
    saveState(ids, matches)
    return { success: true, isMatch, matchedProfile: isMatch ? profile : undefined }
  },
  async getMatches(): Promise<Match[]> {
    await new Promise((resolve) => setTimeout(resolve, 120))
    return readMatches()
  },
}

export function resetMockData() {
  swipedIds = new Set()
  savedMatches = []
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(SWIPES_KEY)
    window.sessionStorage.removeItem(MATCHES_KEY)
  }
}
