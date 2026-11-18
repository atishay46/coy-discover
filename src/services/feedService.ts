import type { FeedResponse } from '@/types'

// Fetches profiles from the real API.
// The API server filters out already-swiped profiles per the demo user in the database.
export const feedService = {
  async getFeed(): Promise<FeedResponse> {
    const response = await fetch('/api/feed')
    if (!response.ok) throw new Error('We could not load profiles right now.')
    return response.json() as Promise<FeedResponse>
  },
}
