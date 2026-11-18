export interface UserProfile {
  id: string
  name: string
  age: number
  location: string
  bio: string
  interests: string[]
  photo: string
  hasLikedMe: boolean
}

export type SwipeAction = 'LIKE' | 'PASS'

export interface SwipeResponse {
  success: boolean
  isMatch: boolean
  matchedProfile?: UserProfile
}

export interface Match {
  id: string
  profile: UserProfile
  matchedAt: string
}

export interface FeedResponse {
  profiles: UserProfile[]
}
