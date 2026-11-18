import { mockAdapter } from '@/data/mockAdapter'
import type { SwipeAction, SwipeResponse } from '@/types'

const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false'

export const swipeService = {
  async submitSwipe(targetUserId: string, action: SwipeAction): Promise<SwipeResponse> {
    if (useMockData) return mockAdapter.submitSwipe(targetUserId, action)
    const response = await fetch('/swipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId, action }),
    })
    if (!response.ok) throw new Error('Your choice could not be saved. Please try again.')
    return response.json() as Promise<SwipeResponse>
  },
}
