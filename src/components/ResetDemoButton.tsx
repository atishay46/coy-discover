'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

// Rendered only in development (see DiscoverApp). Resets swipes and matches via /api/dev/reset.
export function ResetDemoButton({ onReset }: { onReset: () => void }) {
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<'idle' | 'done' | 'error'>('idle')

  async function handleReset() {
    const confirmed = window.confirm(
      'Reset demo data?\n\nThis will:\n• Clear all your swipes and matches\n• Restore the original incoming likes\n\nAll 30 profiles will appear in Discover again.',
    )
    if (!confirmed) return

    setBusy(true)
    setStatus('idle')

    try {
      const res = await fetch('/api/dev/reset', { method: 'POST' })
      let data: { error?: string } = {}
      try { data = await res.json() as { error?: string } } catch { /* empty body */ }
      if (!res.ok) throw new Error(data.error ?? `Reset failed (${res.status}).`)
      setStatus('done')
      setTimeout(() => {
        setStatus('idle')
        onReset()
      }, 1200)
    } catch (err) {
      console.error('Reset failed:', err)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      className="reset-demo-button"
      onClick={() => void handleReset()}
      disabled={busy}
      title="Reset demo data (dev only)"
      aria-label="Reset demo data"
    >
      <RefreshCw size={13} className={busy ? 'spin' : ''} />
      {status === 'done' ? 'Reset!' : status === 'error' ? 'Failed' : 'Reset demo'}
    </button>
  )
}

