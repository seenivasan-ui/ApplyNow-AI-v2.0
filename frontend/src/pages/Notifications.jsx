import React, { useState, useEffect } from 'react'
import { Bell, Mail, MessageCircle, RefreshCw, Star, Clock } from 'lucide-react'
import { fetchNotifications } from '../utils/api'
import { formatDistanceToNow } from 'date-fns'

const TYPE_ICONS = { email: Mail, whatsapp: MessageCircle }
const TYPE_COLORS = {
  email: '#00d4ff',
  whatsapp: '#00ff87',
}

const IMPORTANCE_KEYWORDS = ['shortlisted', 'selected', 'interview', 'offer', 'congratulations', 'assessment']

export default function Notifications() {
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await fetchNotifications()
      setNotifs(data.notifications || [])
    } catch (e) {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const isImportant = (n) =>
    IMPORTANCE_KEYWORDS.some(kw =>
      (n.subject || '').toLowerCase().includes(kw) ||
      (n.snippet || '').toLowerCase().includes(kw)
    )

  const important = notifs.filter(isImportant)
  const rest = notifs.filter(n => !isImportant(n))

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{fontFamily:'Syne'}}>Alerts & Notifications</h1>
          <p className="text-gray-400 text-sm mt-1">Recruiter emails, WhatsApp alerts, shortlist notifications</p>
        </div>
        <button
          onClick={load}
          className="glass px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-neon' : ''} />
          Refresh
        </button>
      </div>

      {/* Important Notifications */}
      {important.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-acid mb-3 flex items-center gap-2">
            <Star size={14} /> Important Notifications
          </h2>
          <div className="space-y-3">
            {important.map((n, i) => (
              <NotifCard key={i} n={n} highlight />
            ))}
          </div>
        </div>
      )}

      {/* All Notifications */}
      <div>
        {important.length > 0 && (
          <h2 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
            <Bell size={14} /> All Notifications
          </h2>
        )}
        {notifs.length === 0 ? (
          <div className="stat-card text-center py-16">
            <Bell size={40} className="mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400">No notifications yet</p>
            <p className="text-gray-600 text-sm mt-1">
              They'll appear here once the agent starts checking your Gmail
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rest.map((n, i) => (
              <NotifCard key={i} n={n} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function NotifCard({ n, highlight }) {
  const Icon = TYPE_ICONS[n.type] || Bell
  const color = TYPE_COLORS[n.type] || '#8b5cf6'

  return (
    <div className={`stat-card ${highlight ? 'border border-acid/30' : ''} animate-slide-in`}>
      {highlight && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-5"
          style={{ background: 'radial-gradient(circle at 10% 10%, #c8ff00, transparent 60%)' }}
        />
      )}
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
          <Icon size={18} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-medium text-white text-sm">
                {n.subject || 'WhatsApp Alert'}
                {highlight && <span className="ml-2 text-xs text-acid">⭐ Important</span>}
              </p>
              {n.from && <p className="text-xs text-gray-500 mt-0.5">From: {n.from}</p>}
            </div>
            {n.created_at && (
              <span className="text-xs text-gray-600 flex items-center gap-1 flex-shrink-0">
                <Clock size={10} />
                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
              </span>
            )}
          </div>
          {n.snippet && (
            <p className="text-xs text-gray-400 mt-2 leading-relaxed line-clamp-2">{n.snippet}</p>
          )}
        </div>
      </div>
    </div>
  )
}
