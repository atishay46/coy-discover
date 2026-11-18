'use client'

import Link from 'next/link'
import { Compass, Heart, House } from 'lucide-react'

const tabs = [
  { href: '/', label: 'Home', icon: House },
  { href: '/discover', label: 'Discover', icon: Compass },
  { href: '/matches', label: 'Matches', icon: Heart },
]

export function BottomNavigation({ active }: { active: string }) {
  return (
    <nav aria-label="Main navigation" className="bottom-nav">
      {tabs.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} aria-current={active === label ? 'page' : undefined} className={`nav-link ${active === label ? 'active' : ''}`}>
          <Icon aria-hidden="true" strokeWidth={active === label ? 2.5 : 1.8} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  )
}
