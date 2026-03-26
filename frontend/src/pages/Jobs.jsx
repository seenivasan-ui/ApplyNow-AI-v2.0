import React, { useState, useEffect, useCallback } from 'react'
import { Search, ExternalLink, Edit3, ChevronDown, Briefcase, RefreshCw } from 'lucide-react'
import { fetchJobs, updateJobStatus } from '../utils/api'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

const STATUSES = ['all', 'applied', 'shortlisted', 'interview', 'pending', 'rejected', 'found']

const STATUS_LABELS = {
  all: 'All Jobs',
  applied: '✅ Applied',
  shortlisted: '⭐ Shortlisted',
  interview: '🎯 Interview',
  pending: '⏳ Pending',
  rejected: '❌ Rejected',
  found: '🔍 Found',
}

export default function Jobs() {
  const [jobs, setJobs] = useState([])
  const [total, setTotal] = useState(0)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const [newStatus, setNewStatus] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchJobs({ status: activeTab, search, page, limit: 15 })
      setJobs(data.jobs || [])
      setTotal(data.total || 0)
    } catch (e) {}
    setLoading(false)
  }, [activeTab, search, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [activeTab, search])

  async function handleStatusChange(job) {
    try {
      await updateJobStatus(job.apply_url, newStatus)
      toast.success(`Status updated to ${newStatus}`)
      setEditingJob(null)
      load()
    } catch (e) {
      toast.error('Failed to update status')
    }
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-3xl font-bold text-white" style={{fontFamily:'Syne'}}>Job Applications</h1>
        <p className="text-gray-400 text-sm mt-1">{total} total jobs tracked</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          className="input-field pl-10"
          placeholder="Search jobs, companies..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setActiveTab(s)}
            className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === s ? 'tab-active' : 'glass text-gray-400 hover:text-white'
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Jobs List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={24} className="text-neon animate-spin" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="stat-card text-center py-16">
          <Briefcase size={40} className="mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400">No jobs found in this category</p>
          <p className="text-gray-600 text-sm mt-1">Start the agent to begin hunting!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job, i) => (
            <div
              key={job.apply_url || i}
              className="stat-card hover:neon-border transition-all duration-200 animate-slide-in"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-start gap-4">
                {/* Company Initial */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-lg font-bold text-white/60 flex-shrink-0">
                  {(job.company || '?').charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <h3 className="font-semibold text-white text-sm sm:text-base">{job.title}</h3>
                      <p className="text-gray-400 text-xs mt-0.5">{job.company} · {job.location}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {job.ats_score > 0 && (
                        <div className="text-center">
                          <div className={`text-sm font-bold font-mono ${
                            job.ats_score >= 80 ? 'text-neon' : job.ats_score >= 60 ? 'text-acid' : 'text-gray-400'
                          }`}>{job.ats_score}%</div>
                          <div className="text-xs text-gray-600">ATS</div>
                        </div>
                      )}
                      <span className={`status-badge status-${job.status}`}>
                        {job.status}
                      </span>
                    </div>
                  </div>

                  {/* Skills */}
                  {job.matched_skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {job.matched_skills.slice(0, 5).map(s => (
                        <span key={s} className="px-2 py-0.5 rounded-md text-xs bg-neon/10 text-neon border border-neon/20">
                          {s}
                        </span>
                      ))}
                      {job.missing_skills?.slice(0, 2).map(s => (
                        <span key={s} className="px-2 py-0.5 rounded-md text-xs bg-plasma/10 text-plasma border border-plasma/20">
                          missing: {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 font-mono bg-white/5 px-2 py-1 rounded">
                        {job.platform}
                      </span>
                      {job.created_at && (
                        <span className="text-xs text-gray-600">
                          {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditingJob(job); setNewStatus(job.status) }}
                        className="text-xs glass px-3 py-1.5 rounded-lg text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <Edit3 size={11} /> Edit
                      </button>
                      <a
                        href={job.apply_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs glass px-3 py-1.5 rounded-lg text-neon hover:text-neon/80 flex items-center gap-1 transition-colors"
                      >
                        View <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 15 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="glass px-4 py-2 rounded-lg text-sm disabled:opacity-30 hover:bg-white/10 transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-400 font-mono px-4">
            {page} / {Math.ceil(total / 15)}
          </span>
          <button
            disabled={page >= Math.ceil(total / 15)}
            onClick={() => setPage(p => p + 1)}
            className="glass px-4 py-2 rounded-lg text-sm disabled:opacity-30 hover:bg-white/10 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Edit Status Modal */}
      {editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass rounded-2xl p-6 w-full max-w-sm neon-border animate-fade-up">
            <h3 className="font-bold text-white mb-1" style={{fontFamily:'Syne'}}>Update Status</h3>
            <p className="text-xs text-gray-400 mb-4">{editingJob.title} at {editingJob.company}</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {['applied','shortlisted','interview','pending','rejected','found'].map(s => (
                <button
                  key={s}
                  onClick={() => setNewStatus(s)}
                  className={`py-2 rounded-lg text-xs font-medium transition-all status-badge status-${s} ${
                    newStatus === s ? 'ring-2 ring-white/30 scale-105' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingJob(null)}
                className="flex-1 glass py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusChange(editingJob)}
                className="flex-1 btn-neon py-2 rounded-lg text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
