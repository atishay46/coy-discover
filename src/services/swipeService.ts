import type { SwipeAction, SwipeResponse } from '@/types'

export const swipeService = {
  async submitSwipe(targetUserId: string, action: SwipeAction): Promise<SwipeResponse> {
    const response = await fetch('/api/swipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId, action }),
    })
    if (!response.ok) throw new Error('Your choice could not be saved. Please try again.')
    return response.json() as Promise<SwipeResponse>
  },
}

