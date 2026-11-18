'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Heart, MapPin, MessageCircle, Sparkles, X } from 'lucide-react'
import { BottomNavigation } from '@/components/BottomNavigation'
import { matchService } from '@/services/matchService'
import type { Match } from '@/types'

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [selected, setSelected] = useState<Match | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { matchService.getMatches().then(setMatches).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Could not load matches.')) }, [])
  return <main className="app-shell"><header className="topbar"><a className="wordmark" href="/">coy<span>.</span></a><div className="discover-label"><span className="pulse-dot" /> mutual feelings</div><span className="avatar-button">A</span></header><section className="matches-content"><span className="eyebrow">THE BEST KIND OF SURPRISE</span><h1>Your <em>matches.</em></h1><p className="matches-intro">A little spark, going both ways.</p>{error ? <p className="empty-matches">{error}</p> : matches.length ? <div className="match-list">{matches.map((match) => <button className="match-row" key={match.id} onClick={() => setSelected(match)}><img src={match.profile.photo} alt="" /><span className="match-row-copy"><strong>{match.profile.name}, {match.profile.age}</strong><small><Heart size={14} fill="currentColor" /> It&apos;s mutual. Say hello?</small></span><span className="chat-arrow"><MessageCircle size={19} /></span></button>)}</div> : <div className="empty-matches"><div className="empty-heart"><Heart /></div><h2>Your story starts here.</h2><p>When you both like each other, you&apos;ll find your match right here. No one-sided secrets.</p><a className="primary-button" href="/discover">Meet someone new</a></div>}<div className="match-note"><Sparkles size={15} /> Only mutual likes become matches</div></section><BottomNavigation active="Matches" />{selected && <div className="match-overlay" role="dialog" aria-modal="true" aria-labelledby="detail-title"><div className="profile-detail"><button className="icon-button detail-close" onClick={() => setSelected(null)} aria-label="Close profile"><X /></button><img className="detail-image" src={selected.profile.photo} alt={`Portrait of ${selected.profile.name}`} /><div className="detail-copy"><span className="eyebrow">IT&apos;S MUTUAL</span><h2 id="detail-title">{selected.profile.name}, {selected.profile.age}</h2><p className="location"><MapPin size={15} /> {selected.profile.location}</p><p>{selected.profile.bio}</p><div className="interest-list">{selected.profile.interests.map((interest) => <span className="interest-tag" key={interest}>{interest}</span>)}</div><button className="primary-button" onClick={() => setSelected(null)}><MessageCircle size={18} /> Say hello</button></div></div></div>}</main>
}
