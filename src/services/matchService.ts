import type { Match } from '@/types'

export const matchService = {
  async getMatches(): Promise<Match[]> {
    const response = await fetch('/api/matches')
    if (!response.ok) throw new Error('We could not load your matches right now.')
    return response.json() as Promise<Match[]>
  },
}

