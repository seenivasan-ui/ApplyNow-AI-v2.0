import React, { useState, useEffect, useRef } from 'react'
import { fetchAgentStatus } from '../utils/api'
import { Terminal, Circle, Trash2 } from 'lucide-react'

const LEVEL_COLORS = {
  info: '#00ff87',
  warn: '#ff8c00',
  error: '#ff2d78',
}

export default function Logs() {
  const [logs, setLogs] = useState([])
  const [autoScroll, setAutoScroll] = useState(true)
  const [running, setRunning] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    load()
    const interval = setInterval(load, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  async function load() {
    try {
      const data = await fetchAgentStatus()
      setLogs(data.log || [])
      setRunning(data.running || false)
    } catch (e) {}
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{fontFamily:'Syne'}}>Live Agent Logs</h1>
          <p className="text-gray-400 text-sm mt-1">Real-time activity feed from the job hunting agent</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 glass px-3 py-2 rounded-lg">
            <div className={`pulse-dot ${running ? 'green' : 'red'}`} />
            <span className={`text-xs font-mono ${running ? 'text-neon' : 'text-plasma'}`}>
              {running ? 'LIVE' : 'IDLE'}
            </span>
          </div>
          <label className="flex items-center gap-2 glass px-3 py-2 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={e => setAutoScroll(e.target.checked)}
              className="accent-neon"
            />
            <span className="text-xs text-gray-400">Auto-scroll</span>
          </label>
        </div>
      </div>

      {/* Terminal */}
      <div className="stat-card">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-plasma/70" />
          <div className="w-3 h-3 rounded-full bg-acid/70" />
          <div className="w-3 h-3 rounded-full bg-neon/70" />
          <span className="text-xs text-gray-600 font-mono ml-2">applynow-agent — terminal</span>
        </div>

        <div
          className="log-terminal bg-black/40 rounded-xl p-4 h-[500px] overflow-y-auto space-y-1"
          style={{scrollbarWidth:'thin', scrollbarColor:'#00ff87 #0d0d1a'}}
        >
          {logs.length === 0 ? (
            <p className="text-gray-700">$ Waiting for agent activity...</p>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="flex gap-3 group hover:bg-white/[0.02] rounded px-2 py-0.5 -mx-2 transition-colors">
                <span className="text-gray-700 flex-shrink-0 text-xs">
                  {new Date(log.time).toLocaleTimeString()}
                </span>
                <span
                  className="flex-shrink-0 uppercase text-xs w-10"
                  style={{ color: LEVEL_COLORS[log.level] || '#9ca3af' }}
                >
                  {log.level}
                </span>
                <span className="text-gray-300 text-xs leading-relaxed">{log.msg}</span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-gray-600 font-mono">{logs.length} entries</span>
          <span className="text-xs text-gray-600 font-mono">Auto-refreshes every 3s</span>
        </div>
      </div>
    </div>
  )
}
