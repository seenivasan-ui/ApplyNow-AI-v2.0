import React, { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { Briefcase, TrendingUp, Award, Clock, Zap, Target, ChevronRight, RefreshCw } from 'lucide-react'
import { fetchJobs } from '../utils/api'
import { formatDistanceToNow } from 'date-fns'

const STATUS_COLORS = {
  applied: '#00ff87',
  shortlisted: '#c8ff00',
  rejected: '#ff2d78',
  pending: '#ff8c00',
  interview: '#00d4ff',
  found: '#8b5cf6',
}

export default function Dashboard({ stats, agentRunning, onToggleAgent }) {
  const [recentJobs, setRecentJobs] = useState([])

  useEffect(() => {
    fetchJobs({ limit: 6 }).then(d => setRecentJobs(d.jobs || []))
  }, [])

  const statCards = [
    {
      label: 'Total Applied',
      value: stats?.counts?.applied || 0,
      icon: Briefcase,
      color: '#00ff87',
      bg: '#00ff8715',
      sub: `${stats?.today_applied || 0} today`,
    },
    {
      label: 'Shortlisted',
      value: stats?.counts?.shortlisted || 0,
      icon: Award,
      color: '#c8ff00',
      bg: '#c8ff0015',
      sub: 'Keep going! 🎯',
    },
    {
      label: 'Avg ATS Score',
      value: `${stats?.avg_ats || 0}%`,
      icon: TrendingUp,
      color: '#00d4ff',
      bg: '#00d4ff15',
      sub: 'Match quality',
    },
    {
      label: 'Pending Review',
      value: stats?.counts?.pending || 0,
      icon: Clock,
      color: '#ff8c00',
      bg: '#ff8c0015',
      sub: 'Needs manual apply',
    },
  ]

  const pieData = Object.entries(stats?.counts || {})
    .filter(([k]) => k !== 'found')
    .map(([k, v]) => ({ name: k, value: v, color: STATUS_COLORS[k] }))
    .filter(d => d.value > 0)

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{fontFamily:'Syne'}}>
            Command Center
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            {agentRunning ? (
              <span className="text-neon">🟢 Agent is actively hunting jobs for you</span>
            ) : (
              <span className="text-gray-500">Agent is idle — start it to begin job hunting</span>
            )}
          </p>
        </div>
        {stats?.last_run && (
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-500 font-mono">Last run</p>
            <p className="text-xs text-gray-300 font-mono">
              {formatDistanceToNow(new Date(stats.last_run), { addSuffix: true })}
            </p>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="stat-card"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: card.bg }}
              >
                <Icon size={18} style={{ color: card.color }} />
              </div>
              <div
                className="text-3xl font-bold font-mono mb-1"
                style={{ color: card.color }}
              >
                {card.value}
              </div>
              <div className="text-sm text-gray-300 font-medium">{card.label}</div>
              <div className="text-xs text-gray-500 mt-1">{card.sub}</div>

              {/* Glow */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none opacity-5"
                style={{ background: `radial-gradient(circle at 20% 20%, ${card.color}, transparent 60%)` }}
              />
            </div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Area Chart */}
        <div className="lg:col-span-2 stat-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-white" style={{fontFamily:'Syne'}}>Applications Trend</h2>
            <span className="text-xs text-gray-500 font-mono">Last 7 days</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={stats?.trend || []}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00ff87" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#00ff87" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#111127', border: '1px solid #1e1e3f', borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: '#9ca3af' }}
                itemStyle={{ color: '#00ff87' }}
              />
              <Area type="monotone" dataKey="applied" stroke="#00ff87" fill="url(#areaGrad)" strokeWidth={2} dot={{ fill: '#00ff87', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie */}
        <div className="stat-card flex flex-col">
          <h2 className="font-bold text-white mb-4" style={{fontFamily:'Syne'}}>Status Breakdown</h2>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                      <span className="text-gray-400 capitalize">{d.name}</span>
                    </div>
                    <span className="font-mono font-bold" style={{ color: d.color }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
              No data yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-white" style={{fontFamily:'Syne'}}>Recent Activity</h2>
          <a href="/jobs" className="text-xs text-neon hover:underline flex items-center gap-1">
            View all <ChevronRight size={12} />
          </a>
        </div>
        <div className="space-y-3">
          {recentJobs.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <Briefcase size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No jobs yet. Start the agent!</p>
            </div>
          ) : (
            recentJobs.map((job, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center text-sm font-bold text-purple-300 flex-shrink-0">
                  {(job.company || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{job.title}</p>
                  <p className="text-xs text-gray-500 truncate">{job.company} · {job.location}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {job.ats_score > 0 && (
                    <span className="text-xs font-mono text-cyan-400">{job.ats_score}%</span>
                  )}
                  <span className={`status-badge status-${job.status}`}>
                    {job.status}
                  </span>
                  <span className="text-xs text-gray-600 hidden sm:block font-mono">
                    {job.platform}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Next Run */}
      {stats?.next_run && (
        <div className="glass rounded-xl p-4 border border-border flex items-center gap-3">
          <RefreshCw size={16} className="text-neon animate-spin" style={{animationDuration:'3s'}} />
          <span className="text-xs text-gray-400 font-mono">
            Next scheduled run: <span className="text-neon">{new Date(stats.next_run).toLocaleTimeString()}</span>
          </span>
        </div>
      )}
    </div>
  )
}
