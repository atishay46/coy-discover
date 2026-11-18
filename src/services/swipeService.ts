import type { SwipeAction, SwipeResponse } from '@/types'

// Submits a swipe action to the real API.
// The API records it in the database and returns whether a mutual match was created.
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
