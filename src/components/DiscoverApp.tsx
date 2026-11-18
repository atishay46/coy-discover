'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { Heart, RefreshCw, Sparkles, X } from 'lucide-react'
import { BottomNavigation } from './BottomNavigation'
import { ProfileCard } from './ProfileCard'
import { ResetDemoButton } from './ResetDemoButton'
import { feedService } from '@/services/feedService'
import { swipeService } from '@/services/swipeService'
import type { UserProfile, SwipeAction } from '@/types'

const IS_DEV = process.env.NODE_ENV === 'development'

function CoyLogo() { return <a className="wordmark" href="/" aria-label="Coy home">coy<span>.</span></a> }

function MatchCelebration({ profile, onClose, onMatches }: { profile: UserProfile; onClose: () => void; onMatches: () => void }) {
  return (
    <motion.div className="match-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-labelledby="match-title">
      <motion.div className="match-sheet" initial={{ y: 30, scale: 0.96 }} animate={{ y: 0, scale: 1 }}>
        <button className="icon-button match-close" onClick={onClose} aria-label="Close match"><X /></button>
        <div className="confetti" aria-hidden="true"><span>♥</span><span>✦</span><span>♥</span><span>✧</span></div>
        <div className="match-photos">
          <div className="match-avatar self-avatar">A</div>
          <div className="match-heart"><Heart fill="currentColor" /></div>
          <img src={profile.photo} alt={`${profile.name}'s portrait`} />
        </div>
        <span className="eyebrow"><Sparkles size={15} /> mutual feelings</span>
        <h2 id="match-title">It&apos;s a match!</h2>
        <p>You and {profile.name} like each other. Your secret is safe with us.</p>
        <button className="primary-button" onClick={onClose}>Keep discovering</button>
        <button className="text-button" onClick={onMatches}>See your matches</button>
      </motion.div>
    </motion.div>
  )
}

export function DiscoverApp({ screen = 'Discover' }: { screen?: 'Home' | 'Discover' | 'Matches' }) {
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [matchedProfile, setMatchedProfile] = useState<UserProfile | null>(null)
  // Tracks the exit direction of the top card so button-triggered swipes animate correctly.
  const [exitDirection, setExitDirection] = useState<'LIKE' | 'PASS' | undefined>(undefined)
  const router = useRouter()

  const loadFeed = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await feedService.getFeed()
      setProfiles(result.profiles)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Something went wrong. Try again.')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { void loadFeed() }, [loadFeed])

  async function choose(action: SwipeAction) {
    const current = profiles[0]
    if (!current || busy) return
    setBusy(true)
    setExitDirection(action)
    try {
      const result = await swipeService.submitSwipe(current.id, action)
      if (!result.success) throw new Error('We could not save that choice. Please try again.')
      setProfiles((items) => items.filter((profile) => profile.id !== current.id))
      if (result.isMatch && result.matchedProfile) setMatchedProfile(result.matchedProfile)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your choice could not be saved.')
    } finally {
      setBusy(false)
      setExitDirection(undefined)
    }
  }

  const goMatches = () => router.push('/matches')

  return (
    <main className="app-shell">
      <header className="topbar"><CoyLogo /><div className="discover-label"><span className="pulse-dot" /> {screen === 'Discover' ? 'A little serendipity' : screen}</div><div className="topbar-right">{IS_DEV && <ResetDemoButton onReset={() => void loadFeed()} />}<button className="avatar-button" aria-label="Your profile">A</button></div></header>
      <section className="discover-content" aria-label="Discover people">
        <div className="page-heading"><div><span className="eyebrow">THE GOOD KIND OF BUTTERFLIES</span><h1>Someone new,<br /><em>just for you.</em></h1></div><span className="daily-badge"><Sparkles size={14} /> today&apos;s picks</span></div>
        <div className="card-stage" aria-live="polite">
          {loading ? <div className="state-card"><div className="loader-heart"><Heart fill="currentColor" /></div><strong>Finding your people...</strong><span>Just a little moment.</span></div> : error ? <div className="state-card"><div className="loader-heart error-icon"><Sparkles /></div><strong>Oops, a little hiccup.</strong><span>{error}</span><button className="secondary-button" onClick={() => void loadFeed()}>Try again</button></div> : profiles.length === 0 ? <div className="state-card"><div className="loader-heart"><Heart fill="currentColor" /></div><strong>You&apos;re all caught up.</strong><span>New faces are on their way. Come back soon!</span><button className="secondary-button" onClick={() => void loadFeed()}><RefreshCw size={16} /> Refresh picks</button></div> : (
            <AnimatePresence initial={false}>
              {profiles.slice(0, 3).reverse().map((profile, index) => <ProfileCard key={profile.id} profile={profile} onSwipe={choose} disabled={busy} stackIndex={2 - index} exitDirection={2 - index === 0 ? exitDirection : undefined} />)}
            </AnimatePresence>
          )}
        </div>
        <div className="card-meta"><span><span className="sparkle-mini">✦</span> Made for a meaningful hello</span><span>{loading ? '—' : `${profiles.length} nearby`}</span></div>
        <div className="action-row" aria-label="Choose a profile">
          <button className="action-button pass-action" onClick={() => void choose('PASS')} disabled={loading || busy || profiles.length === 0} aria-label="Pass"><X /></button>
          <button className="action-button like-action" onClick={() => void choose('LIKE')} disabled={loading || busy || profiles.length === 0} aria-label="Like"><Heart fill="currentColor" /></button>
        </div>
        <p className="privacy-note"><span className="privacy-lock">✳</span> Your likes are always private. Only a match reveals them.</p>
      </section>
      <BottomNavigation active={screen} />
      <AnimatePresence>{matchedProfile && <MatchCelebration profile={matchedProfile} onClose={() => setMatchedProfile(null)} onMatches={goMatches} />}</AnimatePresence>
    </main>
  )
}
