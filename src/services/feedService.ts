import type { FeedResponse } from '@/types'

export const feedService = {
  async getFeed(): Promise<FeedResponse> {
    const response = await fetch('/api/feed')
    if (!response.ok) throw new Error('We could not load profiles right now.')
    return response.json() as Promise<FeedResponse>
  },
}

