import type { Match } from '@/types'

// Fetches confirmed mutual matches from the real API.
// The API reads from the Match table in the database — data persists across page refreshes.
export const matchService = {
  async getMatches(): Promise<Match[]> {
    const response = await fetch('/api/matches')
    if (!response.ok) throw new Error('We could not load your matches right now.')
    return response.json() as Promise<Match[]>
  },
}
