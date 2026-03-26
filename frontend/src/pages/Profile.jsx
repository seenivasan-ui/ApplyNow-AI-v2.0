import React, { useState, useEffect } from 'react'
import { fetchProfile, updateProfile } from '../utils/api'
import { toast } from 'react-hot-toast'
import { Save, Plus, X, User, Briefcase, GraduationCap, Key, Target, Award } from 'lucide-react'

const SECTION_TABS = [
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'skills', label: 'Skills', icon: Award },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'targets', label: 'Job Targets', icon: Target },
  { id: 'credentials', label: 'Credentials', icon: Key },
]

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [tab, setTab] = useState('personal')
  const [saving, setSaving] = useState(false)
  const [newSkill, setNewSkill] = useState('')

  useEffect(() => {
    fetchProfile().then(p => setProfile(p)).catch(() => toast.error('Failed to load profile'))
  }, [])

  async function save() {
    setSaving(true)
    try {
      await updateProfile(profile)
      toast.success('✅ Profile saved!')
    } catch (e) {
      toast.error('Save failed')
    }
    setSaving(false)
  }

  if (!profile) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-neon border-t-transparent rounded-full animate-spin" />
    </div>
  )

  function Field({ label, field, type = 'text', placeholder }) {
    return (
      <div>
        <label className="text-xs text-gray-400 font-medium mb-1 block">{label}</label>
        <input
          type={type}
          className="input-field"
          placeholder={placeholder || label}
          value={profile[field] || ''}
          onChange={e => setProfile({ ...profile, [field]: e.target.value })}
        />
      </div>
    )
  }

  function TextArea({ label, field, rows = 4 }) {
    return (
      <div>
        <label className="text-xs text-gray-400 font-medium mb-1 block">{label}</label>
        <textarea
          rows={rows}
          className="input-field resize-none"
          value={profile[field] || ''}
          onChange={e => setProfile({ ...profile, [field]: e.target.value })}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-up max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{fontFamily:'Syne'}}>My Profile</h1>
          <p className="text-gray-400 text-sm mt-1">Your details used for job applications & resume generation</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="btn-neon px-5 py-2.5 rounded-xl text-sm flex items-center gap-2"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-void border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save size={14} />
          )}
          Save All
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {SECTION_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all ${
              tab === id ? 'tab-active' : 'glass text-gray-400 hover:text-white'
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="stat-card space-y-5">
        {tab === 'personal' && (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full Name" field="name" />
              <Field label="Email" field="email" type="email" />
              <Field label="Phone" field="phone" />
              <Field label="Location" field="location" />
              <Field label="LinkedIn URL" field="linkedin" />
              <Field label="GitHub URL" field="github" />
            </div>
            <TextArea label="Professional Summary" field="summary" rows={5} />
          </>
        )}

        {tab === 'skills' && (
          <div>
            <label className="text-xs text-gray-400 font-medium mb-3 block">Skills ({(profile.skills || []).length})</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {(profile.skills || []).map((skill, i) => (
                <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon/10 border border-neon/20 text-neon text-xs">
                  {skill}
                  <button
                    onClick={() => {
                      const s = [...profile.skills]
                      s.splice(i, 1)
                      setProfile({ ...profile, skills: s })
                    }}
                  >
                    <X size={11} className="hover:text-plasma" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="input-field flex-1"
                placeholder="Add a skill (e.g. React, Python...)"
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newSkill.trim()) {
                    setProfile({ ...profile, skills: [...(profile.skills || []), newSkill.trim()] })
                    setNewSkill('')
                  }
                }}
              />
              <button
                onClick={() => {
                  if (newSkill.trim()) {
                    setProfile({ ...profile, skills: [...(profile.skills || []), newSkill.trim()] })
                    setNewSkill('')
                  }
                }}
                className="btn-neon px-4 py-2 rounded-xl text-sm flex items-center gap-1"
              >
                <Plus size={14} /> Add
              </button>
            </div>
          </div>
        )}

        {tab === 'experience' && (
          <div className="space-y-4">
            {(profile.experience || []).map((exp, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-mono">Experience #{i + 1}</span>
                  <button
                    onClick={() => {
                      const e = [...profile.experience]
                      e.splice(i, 1)
                      setProfile({ ...profile, experience: e })
                    }}
                    className="text-plasma hover:text-plasma/80"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {['role', 'company', 'duration'].map(f => (
                    <div key={f}>
                      <label className="text-xs text-gray-500 capitalize mb-1 block">{f}</label>
                      <input
                        className="input-field text-sm"
                        value={exp[f] || ''}
                        onChange={e => {
                          const arr = [...profile.experience]
                          arr[i] = { ...arr[i], [f]: e.target.value }
                          setProfile({ ...profile, experience: arr })
                        }}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Type</label>
                    <select
                      className="input-field text-sm"
                      value={exp.type || 'job'}
                      onChange={e => {
                        const arr = [...profile.experience]
                        arr[i] = { ...arr[i], type: e.target.value }
                        setProfile({ ...profile, experience: arr })
                      }}
                    >
                      <option value="job">Job</option>
                      <option value="internship">Internship</option>
                      <option value="freelance">Freelance</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Description</label>
                  <textarea
                    rows={3}
                    className="input-field resize-none text-sm"
                    value={exp.description || ''}
                    onChange={e => {
                      const arr = [...profile.experience]
                      arr[i] = { ...arr[i], description: e.target.value }
                      setProfile({ ...profile, experience: arr })
                    }}
                  />
                </div>
              </div>
            ))}
            <button
              onClick={() => setProfile({
                ...profile,
                experience: [...(profile.experience || []), { role: '', company: '', duration: '', type: 'job', description: '' }]
              })}
              className="w-full glass py-3 rounded-xl text-sm text-gray-400 hover:text-white border border-dashed border-border hover:border-neon/40 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={14} /> Add Experience
            </button>
          </div>
        )}

        {tab === 'education' && (
          <div className="space-y-4">
            {(profile.education || []).map((edu, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-mono">Education #{i + 1}</span>
                  <button onClick={() => {
                    const e = [...profile.education]; e.splice(i, 1)
                    setProfile({ ...profile, education: e })
                  }} className="text-plasma"><X size={14} /></button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {['degree', 'institution', 'year', 'percentage'].map(f => (
                    <div key={f}>
                      <label className="text-xs text-gray-500 capitalize mb-1 block">{f}</label>
                      <input className="input-field text-sm" value={edu[f] || ''}
                        onChange={e => {
                          const arr = [...profile.education]; arr[i] = { ...arr[i], [f]: e.target.value }
                          setProfile({ ...profile, education: arr })
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button
              onClick={() => setProfile({ ...profile, education: [...(profile.education || []), { degree: '', institution: '', year: '', percentage: '' }] })}
              className="w-full glass py-3 rounded-xl text-sm text-gray-400 hover:text-white border border-dashed border-border hover:border-neon/40 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={14} /> Add Education
            </button>
          </div>
        )}

        {tab === 'targets' && (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Experience Level (e.g. 0-1, 1-3)" field="experience_level" />
              <Field label="Expected Salary (e.g. 3-6 LPA)" field="expected_salary" />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium mb-2 block">Target Roles</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {(profile.target_roles || []).map((r, i) => (
                  <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs">
                    {r}
                    <button onClick={() => { const arr = [...profile.target_roles]; arr.splice(i,1); setProfile({...profile, target_roles: arr}) }}><X size={11} /></button>
                  </span>
                ))}
              </div>
              <input className="input-field text-sm" placeholder="Press Enter to add a role..."
                onKeyDown={e => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    setProfile({ ...profile, target_roles: [...(profile.target_roles||[]), e.target.value.trim()] })
                    e.target.value = ''
                  }
                }}
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium mb-2 block">Target Locations</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {(profile.target_locations || []).map((l, i) => (
                  <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs">
                    {l}
                    <button onClick={() => { const arr = [...profile.target_locations]; arr.splice(i,1); setProfile({...profile, target_locations: arr}) }}><X size={11} /></button>
                  </span>
                ))}
              </div>
              <input className="input-field text-sm" placeholder="Press Enter to add a location..."
                onKeyDown={e => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    setProfile({ ...profile, target_locations: [...(profile.target_locations||[]), e.target.value.trim()] })
                    e.target.value = ''
                  }
                }}
              />
            </div>
          </>
        )}

        {tab === 'credentials' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs">
              ⚠️ Credentials are stored in your MongoDB. Use a strong password for your DB. Never share your .env file.
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Naukri Email" field="naukri_email" type="email" />
              <Field label="Naukri Password" field="naukri_password" type="password" />
              <Field label="LinkedIn Email" field="linkedin_email" type="email" />
              <Field label="LinkedIn Password" field="linkedin_password" type="password" />
              <Field label="WhatsApp Number" field="whatsapp_number" placeholder="+919876543210" />
              <Field label="Aadhar Number (for form fills)" field="aadhar_number" />
              <Field label="PAN Number (for form fills)" field="pan_number" />
            </div>
          </div>
        )}
      </div>

      {/* Save Button Bottom */}
      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="btn-neon px-8 py-3 rounded-xl font-bold flex items-center gap-2"
        >
          {saving ? <div className="w-4 h-4 border-2 border-void border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
          Save Profile
        </button>
      </div>
    </div>
  )
}
