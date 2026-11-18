import { BottomNavigation } from '@/components/BottomNavigation'

export default function HomePage() {
  return <main className="app-shell"><header className="topbar"><a className="wordmark" href="/">coy<span>.</span></a><span className="discover-label">Your little corner</span><span className="avatar-button" aria-label="Your profile">A</span></header><section className="home-blank" aria-label="Home"><span className="eyebrow">COY, YOUR WAY</span><h1>Good things<br /><em>take a little time.</em></h1><p>Your home is yours. When you&apos;re ready, there are lovely people to meet.</p><a className="primary-button home-cta" href="/discover">Explore people</a></section><BottomNavigation active="Home" /></main>
}
