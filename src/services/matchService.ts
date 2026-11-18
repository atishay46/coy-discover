import { mockAdapter } from '@/data/mockAdapter'
import type { Match } from '@/types'

const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false'

export const matchService = {
  async getMatches(): Promise<Match[]> {
    if (useMockData) return mockAdapter.getMatches()
    const response = await fetch('/matches')
    if (!response.ok) throw new Error('We could not load your matches right now.')
    return response.json() as Promise<Match[]>
  },
}
