import { useEffect, useState } from 'react'
import { Users, ClipboardList, CheckCircle2, Clock, AlertTriangle, Radio, Megaphone } from 'lucide-react'
import { getAdminStats } from '../../services/adminService'
import { sendBroadcast } from '../../services/notificationService'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const [stats,    setStats]    = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [msg,      setMsg]      = useState('')
  const [sending,  setSending]  = useState(false)

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleBroadcast(e) {
    e.preventDefault()
    if (!msg.trim()) return
    setSending(true)
    try {
      const result = await sendBroadcast(msg.trim())
      toast.success(`Broadcast sent to ${result.sent} volunteers`)
      setMsg('')
    } catch (err) {
      toast.error(err.message)
    } finally { setSending(false) }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <Radio size={20} className="text-blue-600" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">Admin HQ</h1>
          <p className="text-slate-500 text-sm">Platform overview and controls</p>
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><LoadingSpinner text="Loading stats..." /></div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Volunteers', value: stats?.totalVolunteers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Active Now', value: stats?.activeVolunteers, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Total Tasks', value: stats?.totalTasks, icon: ClipboardList, color: 'text-slate-600', bg: 'bg-slate-100' },
              { label: 'In Progress', value: stats?.tasksByStatus?.in_progress, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon size={20} className={color} />
                </div>
                <p className="font-heading text-2xl font-bold text-slate-900">{value ?? 0}</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Task status breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-heading font-bold text-slate-800 mb-4">Task Status Breakdown</h3>
              <div className="space-y-3">
                {[
                  { label: 'Pending',     key: 'pending',     color: 'bg-slate-200',  fill: 'bg-slate-500'   },
                  { label: 'In Progress', key: 'in_progress', color: 'bg-blue-100',   fill: 'bg-blue-500'    },
                  { label: 'Completed',   key: 'completed',   color: 'bg-emerald-100',fill: 'bg-emerald-500' },
                  { label: 'Cancelled',   key: 'cancelled',   color: 'bg-red-100',    fill: 'bg-red-400'     },
                ].map(({ label, key, color, fill }) => {
                  const count = stats?.tasksByStatus?.[key] || 0
                  const total = stats?.totalTasks || 1
                  const pct   = Math.round((count / total) * 100)
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-600">{label}</span>
                        <span className="text-sm font-semibold text-slate-900">{count}</span>
                      </div>
                      <div className={`h-2 rounded-full ${color}`}>
                        <div className={`h-2 rounded-full ${fill} transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Broadcast */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <Megaphone size={18} className="text-red-500" />
                <h3 className="font-heading font-bold text-slate-800">Emergency Broadcast</h3>
              </div>
              <p className="text-slate-400 text-xs mb-4">Send an urgent alert to all active volunteers instantly.</p>
              <form onSubmit={handleBroadcast} className="space-y-3">
                <textarea
                  value={msg}
                  onChange={e => setMsg(e.target.value)}
                  placeholder="Type your emergency message here..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition"
                />
                <button
                  type="submit" disabled={sending || !msg.trim()}
                  className="w-full py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {sending ? <LoadingSpinner size="sm" /> : <Megaphone size={15} />}
                  {sending ? 'Sending...' : '🚨 Send Broadcast'}
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
