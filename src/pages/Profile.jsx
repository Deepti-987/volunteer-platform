import { useEffect, useState } from 'react'
import { User, Save } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { updateMyProfile, SKILL_OPTIONS } from '../services/volunteerService'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function Profile() {
  const { volunteer, setVolunteer } = useAuth()
  const [form, setForm]       = useState({ name: '', skills: [], availability: 'inactive' })
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    if (volunteer) setForm({ name: volunteer.name || '', skills: volunteer.skills || [], availability: volunteer.availability || 'inactive' })
  }, [volunteer])

  function toggleSkill(skill) {
    setForm(f => ({
      ...f,
      skills: f.skills.includes(skill) ? f.skills.filter(s => s !== skill) : [...f.skills, skill]
    }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await updateMyProfile(form)
      setVolunteer(updated)
      toast.success('Profile updated successfully')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!volunteer) return <div className="p-8 flex justify-center"><LoadingSpinner /></div>

  return (
    <div className="p-6 max-w-2xl mx-auto fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <User size={20} className="text-blue-600" />
        </div>
        <div>
          <h1 className="font-heading text-xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-500 text-sm">Update your volunteer information</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-heading font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide">Personal Info</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text" required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email" disabled
                value={volunteer.email || ''}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 text-sm cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Availability Status</label>
              <div className="flex gap-3">
                {['active', 'inactive'].map(s => (
                  <button
                    key={s} type="button"
                    onClick={() => setForm({ ...form, availability: s })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all capitalize ${
                      form.availability === s
                        ? s === 'active'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-slate-100 border-slate-200 text-slate-700'
                        : 'border-slate-200 text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {s === 'active' ? '🟢' : '⚫'} {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-heading font-bold text-slate-800 mb-1 text-sm uppercase tracking-wide">Skills</h3>
          <p className="text-slate-400 text-xs mb-4">Select all that apply — used for task matching</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SKILL_OPTIONS.map(skill => (
              <button
                key={skill} type="button"
                onClick={() => toggleSkill(skill)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border capitalize transition-all ${
                  form.skills.includes(skill)
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-200'
                    : 'border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {skill.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-heading font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide">Account Info</h3>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Role</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${volunteer.role === 'admin' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
              {volunteer.role}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-3">
            <span className="text-slate-500">Member since</span>
            <span className="text-slate-700 font-medium">
              {volunteer.created_at ? new Date(volunteer.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
            </span>
          </div>
        </div>

        <button
          type="submit" disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-all shadow-sm"
        >
          {saving ? <LoadingSpinner size="sm" /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
