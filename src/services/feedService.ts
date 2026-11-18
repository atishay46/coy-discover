import { mockAdapter } from '@/data/mockAdapter'
import type { FeedResponse } from '@/types'

const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false'

export const feedService = {
  async getFeed(): Promise<FeedResponse> {
    if (useMockData) return { profiles: await mockAdapter.getFeed() }
    const response = await fetch('/feed')
    if (!response.ok) throw new Error('We could not load profiles right now.')
    return response.json() as Promise<FeedResponse>
  },
}
