import React, { useState, useEffect } from 'react'
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { Toaster, toast } from 'react-hot-toast'
import {
  LayoutDashboard, Briefcase, Bell, UserCircle,
  Terminal, Play, Square, Zap, ChevronRight, Menu, X
} from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Jobs from './pages/Jobs'
import Profile from './pages/Profile'
import Notifications from './pages/Notifications'
import Logs from './pages/Logs'
import { fetchStats, startAgent, stopAgent } from './utils/api'

export default function App() {
  const [stats, setStats] = useState(null)
  const [agentRunning, setAgentRunning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    loadStats()
    const interval = setInterval(loadStats, 10000)
    return () => clearInterval(interval)
  }, [])

  async function loadStats() {
    try {
      const data = await fetchStats()
      setStats(data)
      setAgentRunning(data.agent_running)
    } catch (e) {}
  }

  async function toggleAgent() {
    setLoading(true)
    try {
      if (agentRunning) {
        await stopAgent()
        toast.success('⏹️ Agent stopped')
        setAgentRunning(false)
      } else {
        await startAgent()
        toast.success('🚀 Agent started! Hunting jobs...')
        setAgentRunning(true)
      }
      setTimeout(loadStats, 1000)
    } catch (e) {
      toast.error('Failed to toggle agent')
    }
    setLoading(false)
  }

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/jobs', icon: Briefcase, label: 'Jobs' },
    { to: '/notifications', icon: Bell, label: 'Alerts' },
    { to: '/profile', icon: UserCircle, label: 'My Profile' },
    { to: '/logs', icon: Terminal, label: 'Live Logs' },
  ]

  return (
    <div className="min-h-screen bg-void grid-bg noise-bg flex">
      <Toaster position="top-right" toastOptions={{
        style: { background: '#111127', color: '#e8e8f0', border: '1px solid #1e1e3f' }
      }} />

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 glass border-r border-border
        transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:flex lg:flex-col
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon to-cyan-400 flex items-center justify-center">
              <Zap size={20} className="text-void" />
            </div>
            <div>
              <h1 className="font-display font-800 text-xl text-white" style={{fontFamily:'Syne',fontWeight:800}}>
                Apply<span className="text-neon">Now</span>
              </h1>
              <p className="text-xs text-gray-500 font-mono">AI Job Hunter v2.0</p>
            </div>
          </div>
        </div>

        {/* Agent Control */}
        <div className="p-4 border-b border-border">
          <div className="glass rounded-xl p-4 neon-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400 font-mono uppercase tracking-wider">Agent Status</span>
              <div className="flex items-center gap-2">
                <div className={`pulse-dot ${agentRunning ? 'green' : 'red'}`} />
                <span className={`text-xs font-mono ${agentRunning ? 'text-neon' : 'text-plasma'}`}>
                  {agentRunning ? 'ACTIVE' : 'IDLE'}
                </span>
              </div>
            </div>
            <button
              onClick={toggleAgent}
              disabled={loading}
              className={`w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                agentRunning ? 'btn-stop' : 'btn-neon'
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : agentRunning ? (
                <><Square size={14} /> STOP AGENT</>
              ) : (
                <><Play size={14} /> START AGENT</>
              )}
            </button>
            {stats && (
              <p className="text-center text-xs text-gray-500 mt-2 font-mono">
                {stats.applied_today || 0} applied today
              </p>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'tab-active'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'text-neon' : 'text-gray-500 group-hover:text-gray-300'} />
                  <span style={{fontFamily:'DM Sans'}}>{label}</span>
                  {isActive && <ChevronRight size={14} className="ml-auto text-neon" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Stats mini */}
        {stats && (
          <div className="p-4 border-t border-border">
            <div className="grid grid-cols-2 gap-2 text-center">
              {[
                { label: 'Applied', value: stats.counts?.applied || 0, color: 'text-neon' },
                { label: 'Shortlisted', value: stats.counts?.shortlisted || 0, color: 'text-acid' },
                { label: 'Rejected', value: stats.counts?.rejected || 0, color: 'text-plasma' },
                { label: 'Pending', value: stats.counts?.pending || 0, color: 'text-orange-400' },
              ].map(s => (
                <div key={s.label} className="glass rounded-lg p-2">
                  <div className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 glass border-b border-border sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu size={22} className="text-gray-300" />
          </button>
          <span className="font-display font-bold text-lg" style={{fontFamily:'Syne'}}>
            Apply<span className="text-neon">Now</span>
          </span>
          <div className="flex items-center gap-2">
            <div className={`pulse-dot ${agentRunning ? 'green' : 'red'}`} />
          </div>
        </div>

        <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard stats={stats} agentRunning={agentRunning} onToggleAgent={toggleAgent} />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/logs" element={<Logs />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
