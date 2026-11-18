import { PrismaClient } from '@prisma/client'

// Demo user (the logged-in user for the app)
const DEMO_USER = {
  id: 'demo-user-01',
  name: 'Alex',
  age: 25,
  photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=85',
  bio: 'Adventure seeker with a love for coffee, hiking, and finding the best hidden restaurants in the city.',
  city: 'New York, NY',
  college: 'NYU',
  interests: JSON.stringify(['Hiking', 'Coffee', 'Photography', 'Music']),
}

// 30 realistic mock profiles
const PROFILES = [
  {
    id: 'profile-01',
    name: 'Maya',
    age: 24,
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85',
    bio: 'Collecting little moments and very big playlists.',
    city: 'Brooklyn, NY',
    college: 'Pratt Institute',
    interests: JSON.stringify(['Film photos', 'Sunday markets', 'Indie music']),
  },
  {
    id: 'profile-02',
    name: 'Sofia',
    age: 23,
    photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=85',
    bio: 'Usually looking for the best matcha in the city.',
    city: 'New York, NY',
    college: 'Columbia University',
    interests: JSON.stringify(['Matcha', 'Ceramics', 'Museums']),
  },
  {
    id: 'profile-03',
    name: 'Ava',
    age: 25,
    photo: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85',
    bio: 'I make a mean pasta and a questionable playlist.',
    city: 'Queens, NY',
    college: 'Queens College',
    interests: JSON.stringify(['Pasta', 'Live music', 'Dogs']),
  },
  {
    id: 'profile-04',
    name: 'Isabella',
    age: 22,
    photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=900&q=85',
    bio: 'Bookshop wanderer. Amateur baker. Full-time optimist.',
    city: 'Manhattan, NY',
    college: 'NYU',
    interests: JSON.stringify(['Baking', 'Books', 'Long walks']),
  },
  {
    id: 'profile-05',
    name: 'Nina',
    age: 26,
    photo: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=900&q=85',
    bio: 'Here for good conversation and better dumplings.',
    city: 'Brooklyn, NY',
    college: 'Brooklyn College',
    interests: JSON.stringify(['Food spots', 'Travel', 'Jazz']),
  },
  {
    id: 'profile-06',
    name: 'Leah',
    age: 24,
    photo: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&w=900&q=85',
    bio: 'Making my way through every little gallery.',
    city: 'Jersey City, NJ',
    college: 'Rutgers University',
    interests: JSON.stringify(['Art', 'Coffee', 'Running']),
  },
  {
    id: 'profile-07',
    name: 'Amara',
    age: 25,
    photo: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=900&q=85',
    bio: 'Plant parent with a soft spot for old movies.',
    city: 'New York, NY',
    college: 'The New School',
    interests: JSON.stringify(['Plants', 'Cinema', 'Cooking']),
  },
  {
    id: 'profile-08',
    name: 'Chloe',
    age: 23,
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=85',
    bio: 'A good morning person, after coffee.',
    city: 'Brooklyn, NY',
    college: 'Parsons School of Design',
    interests: JSON.stringify(['Hiking', 'Coffee', 'Design']),
  },
  {
    id: 'profile-09',
    name: 'Priya',
    age: 24,
    photo: 'https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?auto=format&fit=crop&w=900&q=85',
    bio: 'I will absolutely stop to pet your dog.',
    city: 'Queens, NY',
    college: 'Fordham University',
    interests: JSON.stringify(['Dogs', 'Yoga', 'Tacos']),
  },
  {
    id: 'profile-10',
    name: 'Zoe',
    age: 22,
    photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=85',
    bio: 'Taking the scenic route, always.',
    city: 'New York, NY',
    college: 'Hunter College',
    interests: JSON.stringify(['Thrifting', 'Road trips', 'Music']),
  },
  {
    id: 'profile-11',
    name: 'Grace',
    age: 27,
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=85',
    bio: 'Big fan of small dinner parties.',
    city: 'Brooklyn, NY',
    college: 'Sarah Lawrence College',
    interests: JSON.stringify(['Cooking', 'Gardening', 'Podcasts']),
  },
  {
    id: 'profile-12',
    name: 'Lily',
    age: 24,
    photo: 'https://images.unsplash.com/photo-1526510747491-58f928ec870f?auto=format&fit=crop&w=900&q=85',
    bio: 'Currently learning to make sourdough behave.',
    city: 'Hoboken, NJ',
    college: 'Stevens Institute of Technology',
    interests: JSON.stringify(['Baking', 'Cycling', 'Books']),
  },
  {
    id: 'profile-13',
    name: 'Ella',
    age: 25,
    photo: 'https://images.unsplash.com/photo-1524503033411-f7a2fe8c7f4f?auto=format&fit=crop&w=900&q=85',
    bio: 'Let\'s find a new neighborhood to get lost in.',
    city: 'Manhattan, NY',
    college: 'Columbia University',
    interests: JSON.stringify(['Travel', 'Brunch', 'Museums']),
  },
  {
    id: 'profile-14',
    name: 'Mia',
    age: 23,
    photo: 'https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?auto=format&fit=crop&w=900&q=85',
    bio: 'I have strong opinions about movie endings.',
    city: 'Brooklyn, NY',
    college: 'Brooklyn College',
    interests: JSON.stringify(['Movies', 'Popcorn', 'Trivia']),
  },
  {
    id: 'profile-15',
    name: 'Layla',
    age: 26,
    photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=85',
    bio: 'Always down for a spontaneous day trip.',
    city: 'Queens, NY',
    college: 'St. John\'s University',
    interests: JSON.stringify(['Travel', 'Hiking', 'Food']),
  },
  {
    id: 'profile-16',
    name: 'Hannah',
    age: 24,
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85',
    bio: 'My camera roll is mostly sunsets and snacks.',
    city: 'New York, NY',
    college: 'NYU',
    interests: JSON.stringify(['Photography', 'Parks', 'Boba']),
  },
  {
    id: 'profile-17',
    name: 'Aria',
    age: 22,
    photo: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85',
    bio: 'Dancing in the kitchen is non-negotiable.',
    city: 'Brooklyn, NY',
    college: 'Pratt Institute',
    interests: JSON.stringify(['Dancing', 'Cooking', 'Concerts']),
  },
  {
    id: 'profile-18',
    name: 'Emma',
    age: 25,
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=85',
    bio: 'Looking for a co-pilot for weekend adventures.',
    city: 'Jersey City, NJ',
    college: 'Rutgers University',
    interests: JSON.stringify(['Kayaking', 'Coffee', 'Travel']),
  },
  {
    id: 'profile-19',
    name: 'Ivy',
    age: 24,
    photo: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&w=900&q=85',
    bio: 'A little bit of everything, a lot of curiosity.',
    city: 'Manhattan, NY',
    college: 'The New School',
    interests: JSON.stringify(['Fashion', 'Art', 'Dim sum']),
  },
  {
    id: 'profile-20',
    name: 'Ruby',
    age: 23,
    photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=900&q=85',
    bio: 'Usually at a gig or planning the next one.',
    city: 'Brooklyn, NY',
    college: 'Berklee College of Music',
    interests: JSON.stringify(['Live music', 'Vinyl', 'Pizza']),
  },
  {
    id: 'profile-21',
    name: 'Sienna',
    age: 26,
    photo: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=900&q=85',
    bio: 'Let\'s trade favorite places and stories.',
    city: 'Queens, NY',
    college: 'Queens College',
    interests: JSON.stringify(['Bookstores', 'Travel', 'Tea']),
  },
  {
    id: 'profile-22',
    name: 'Audrey',
    age: 24,
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=85',
    bio: 'Trying new things, one tiny adventure at a time.',
    city: 'New York, NY',
    college: 'Columbia University',
    interests: JSON.stringify(['Pottery', 'Parks', 'Brunch']),
  },
  {
    id: 'profile-23',
    name: 'Jade',
    age: 25,
    photo: 'https://images.unsplash.com/photo-1524503033411-f7a2fe8c7f4f?auto=format&fit=crop&w=900&q=85',
    bio: 'The way to my heart is through a great playlist.',
    city: 'Brooklyn, NY',
    college: 'Pratt Institute',
    interests: JSON.stringify(['Music', 'Running', 'Sushi']),
  },
  {
    id: 'profile-24',
    name: 'Luna',
    age: 22,
    photo: 'https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?auto=format&fit=crop&w=900&q=85',
    bio: 'Here for the plot, preferably a cute one.',
    city: 'Manhattan, NY',
    college: 'NYU Tisch',
    interests: JSON.stringify(['Theater', 'Coffee', 'Thrifting']),
  },
  {
    id: 'profile-25',
    name: 'Clara',
    age: 27,
    photo: 'https://images.unsplash.com/photo-1526510747491-58f928ec870f?auto=format&fit=crop&w=900&q=85',
    bio: 'Weekend hikes, weekday daydreams.',
    city: 'Hoboken, NJ',
    college: 'Stevens Institute of Technology',
    interests: JSON.stringify(['Hiking', 'Baking', 'Podcasts']),
  },
  {
    id: 'profile-26',
    name: 'Naomi',
    age: 24,
    photo: 'https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?auto=format&fit=crop&w=900&q=85',
    bio: 'A little sunshine and a lot of spicy noodles.',
    city: 'Queens, NY',
    college: 'CUNY',
    interests: JSON.stringify(['Noodles', 'Yoga', 'Travel']),
  },
  {
    id: 'profile-27',
    name: 'Freya',
    age: 23,
    photo: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=900&q=85',
    bio: 'I collect recipes and forget to follow them.',
    city: 'Brooklyn, NY',
    college: 'Brooklyn College',
    interests: JSON.stringify(['Cooking', 'Plants', 'Comedy']),
  },
  {
    id: 'profile-28',
    name: 'Elena',
    age: 25,
    photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=85',
    bio: 'Let\'s make an ordinary Tuesday a good story.',
    city: 'New York, NY',
    college: 'Fordham University',
    interests: JSON.stringify(['Museums', 'Jazz', 'Walking']),
  },
  {
    id: 'profile-29',
    name: 'Tessa',
    age: 26,
    photo: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85',
    bio: 'Mostly here for a plus-one at the farmers market.',
    city: 'Jersey City, NJ',
    college: 'Rutgers University',
    interests: JSON.stringify(['Farmers markets', 'Dogs', 'Pasta']),
  },
  {
    id: 'profile-30',
    name: 'Noor',
    age: 24,
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85',
    bio: 'Always curious, occasionally competitive at trivia.',
    city: 'Manhattan, NY',
    college: 'Columbia University',
    interests: JSON.stringify(['Trivia', 'Art', 'Coffee']),
  },
]

// Profiles that have already liked the demo user (indices 0-based, so profile-01, profile-04, etc.)
// Using profile IDs: profile-01, profile-04, profile-08, profile-12, profile-17, profile-23, profile-28
const PROFILES_WHO_LIKED_DEMO = new Set([
  'profile-01',
  'profile-04',
  'profile-08',
  'profile-12',
  'profile-17',
  'profile-23',
  'profile-28',
])

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // 1. Upsert the demo user
  await prisma.user.upsert({
    where: { id: DEMO_USER.id },
    update: DEMO_USER,
    create: DEMO_USER,
  })
  console.log(`✅ Demo user seeded: ${DEMO_USER.name} (${DEMO_USER.id})`)

  // 2. Upsert all profiles
  for (const profile of PROFILES) {
    await prisma.user.upsert({
      where: { id: profile.id },
      update: profile,
      create: profile,
    })
  }
  console.log(`✅ ${PROFILES.length} profiles seeded`)

  // 3. Seed one-sided likes: some profiles have already liked the demo user.
  //    We use upsert to keep this idempotent.
  for (const profileId of PROFILES_WHO_LIKED_DEMO) {
    await prisma.swipe.upsert({
      where: {
        fromUserId_toUserId: {
          fromUserId: profileId,
          toUserId: DEMO_USER.id,
        },
      },
      update: { action: 'LIKE' },
      create: {
        fromUserId: profileId,
        toUserId: DEMO_USER.id,
        action: 'LIKE',
      },
    })
  }
  console.log(`✅ ${PROFILES_WHO_LIKED_DEMO.size} pre-seeded likes recorded (profiles who liked demo user)`)

  console.log('🎉 Seed complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

