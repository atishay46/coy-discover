'use client'

import { motion, useMotionValue, useTransform } from 'framer-motion'
import { MapPin, Sparkles } from 'lucide-react'
import type { PanInfo } from 'framer-motion'
import type { UserProfile } from '@/types'

interface ProfileCardProps {
  profile: UserProfile
  onSwipe: (direction: 'LIKE' | 'PASS') => void
  disabled: boolean
  stackIndex?: number
}

export function ProfileCard({ profile, onSwipe, disabled, stackIndex = 0 }: ProfileCardProps) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-220, 220], [-12, 12])
  const likeOpacity = useTransform(x, [30, 130], [0, 1])
  const passOpacity = useTransform(x, [-130, -30], [1, 0])

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (Math.abs(info.offset.x) > 100 && !disabled) onSwipe(info.offset.x > 0 ? 'LIKE' : 'PASS')
  }

  return (
    <motion.article
      className="profile-card"
      style={{ x, rotate, zIndex: 10 - stackIndex }}
      drag={stackIndex === 0 && !disabled ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.82}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.97, y: 12, opacity: 0 }}
      animate={{ scale: 1 - stackIndex * 0.035, y: stackIndex * 10, opacity: 1 }}
      exit={{ x: x.get() > 0 ? 500 : -500, opacity: 0, rotate: x.get() > 0 ? 18 : -18 }}
      transition={{ type: 'spring', stiffness: 260, damping: 25 }}
      aria-label={`${profile.name}, ${profile.age}`}
    >
      <div className="profile-photo" style={{ backgroundImage: `url("${profile.photo}")` }} role="img" aria-label={`Portrait of ${profile.name}`}>
        <div className="photo-wash" />
        <motion.div className="swipe-stamp like-stamp" style={{ opacity: likeOpacity }}>LIKE</motion.div>
        <motion.div className="swipe-stamp pass-stamp" style={{ opacity: passOpacity }}>PASS</motion.div>
        <div className="photo-topline"><span className="verified"><Sparkles size={14} /> Your kind of person</span><span className="photo-count">01 / 04</span></div>
        <div className="profile-copy">
          <div className="name-line"><h2>{profile.name}, {profile.age}</h2><span className="online-dot" aria-label="Active recently" /></div>
          <p className="location"><MapPin size={16} /> {profile.location}</p>
          <p className="bio">{profile.bio}</p>
          <div className="interest-list">{profile.interests.map((interest) => <span className="interest-tag" key={interest}>{interest}</span>)}</div>
        </div>
      </div>
    </motion.article>
  )
}
