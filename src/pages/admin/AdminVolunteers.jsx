import { useEffect, useState } from 'react'
import { Users, Search, Shield, User } from 'lucide-react'
import { getAllVolunteers } from '../../services/volunteerService'
import { setVolunteerRole } from '../../services/adminService'
import { exportToCSV } from '../../utils/csvExport'
import LoadingSpinner from '../../components/LoadingSpinner'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function AdminVolunteers() {
  const [volunteers, setVolunteers] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')

  useEffect(() => {
    getAllVolunteers()
      .then(setVolunteers)
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleRoleToggle(vol) {
    const newRole = vol.role === 'admin' ? 'volunteer' : 'admin'
    if (!confirm(`Set ${vol.name} as ${newRole}?`)) return
    try {
      const updated = await setVolunteerRole(vol.id, newRole)
      setVolunteers(vs => vs.map(v => v.id === vol.id ? { ...v, role: updated.role } : v))
      toast.success(`${vol.name} is now ${newRole}`)
    } catch (err) { toast.error(err.message) }
  }

  const filtered = volunteers.filter(v =>
    v.name?.toLowerCase().includes(search.toLowerCase()) ||
    v.email?.toLowerCase().includes(search.toLowerCase())
  )

  const active = volunteers.filter(v => v.availability === 'active').length

  return (
    <div className="p-6 max-w-6xl mx-auto fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-xl font-bold text-slate-900">Volunteers</h1>
          <p className="text-slate-500 text-sm">{volunteers.length} registered · {active} active</p>
        </div>
        <button
          onClick={() => exportToCSV(volunteers.map(v => ({ ...v, skills: v.skills?.join(', ') })), 'volunteers')}
          className="px-4 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
        >
          Export CSV
        </button>
      </div>

      <div className="relative mb-5">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><LoadingSpinner text="Loading volunteers..." /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-100">
          <Users size={36} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400">No volunteers found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Volunteer','Email','Status','Skills','Role','Joined','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(vol => (
                <tr key={vol.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-bold text-xs">{vol.name?.[0]?.toUpperCase()}</span>
                      </div>
                      <span className="font-semibold text-slate-800">{vol.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{vol.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${vol.availability === 'active' ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                      <span className={`text-xs font-semibold capitalize ${vol.availability === 'active' ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {vol.availability}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(vol.skills || []).slice(0, 3).map(s => (
                        <span key={s} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded capitalize">{s}</span>
                      ))}
                      {(vol.skills || []).length > 3 && (
                        <span className="text-[10px] text-slate-400">+{vol.skills.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${vol.role === 'admin' ? 'text-blue-700 bg-blue-50' : 'text-slate-500 bg-slate-100'}`}>
                      {vol.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {vol.created_at ? format(new Date(vol.created_at), 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleRoleToggle(vol)}
                      title={vol.role === 'admin' ? 'Revoke admin' : 'Make admin'}
                      className={`p-1.5 rounded-lg transition-all ${vol.role === 'admin' ? 'text-blue-500 hover:bg-blue-50' : 'text-slate-400 hover:bg-slate-100'}`}
                    >
                      {vol.role === 'admin' ? <Shield size={15} /> : <User size={15} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
