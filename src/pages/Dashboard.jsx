import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, CheckCircle2, Clock, AlertTriangle, ToggleLeft, ToggleRight, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getMyTasks } from '../services/taskService'
import { toggleAvailability } from '../services/volunteerService'
import LoadingSpinner from '../components/LoadingSpinner'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const priorityColor = { low: 'text-slate-500 bg-slate-100', medium: 'text-amber-600 bg-amber-50', high: 'text-orange-600 bg-orange-50', critical: 'text-red-600 bg-red-50' }
const statusColor   = { pending: 'text-slate-600 bg-slate-100', in_progress: 'text-blue-600 bg-blue-50', completed: 'text-emerald-600 bg-emerald-50', cancelled: 'text-red-600 bg-red-50' }

export default function Dashboard() {
  const { volunteer, setVolunteer } = useAuth()
  const [tasks, setTasks]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [toggling, setToggling]     = useState(false)

  useEffect(() => {
    getMyTasks()
      .then(setTasks)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleToggle() {
    setToggling(true)
    try {
      const updated = await toggleAvailability(volunteer.availability)
      setVolunteer(updated)
      toast.success(`Status set to ${updated.availability}`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setToggling(false)
    }
  }

  const active    = tasks.filter(t => t.status === 'in_progress').length
  const pending   = tasks.filter(t => t.status === 'pending').length
  const completed = tasks.filter(t => t.status === 'completed').length

  return (
    <div className="p-6 max-w-5xl mx-auto fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">
            Welcome, {volunteer?.name?.split(' ')[0] || 'Volunteer'} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">Here's your mission overview</p>
        </div>
        <button
          onClick={handleToggle} disabled={toggling}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm ${
            volunteer?.availability === 'active'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
          }`}
        >
          {volunteer?.availability === 'active'
            ? <><ToggleRight size={20} className="text-emerald-500" /> Active — Go Offline</>
            : <><ToggleLeft size={20} /> Inactive — Go Active</>
          }
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Active Tasks',    value: active,    icon: Clock,          color: 'text-blue-600',    bg: 'bg-blue-50'    },
          { label: 'Pending Tasks',   value: pending,   icon: AlertTriangle,  color: 'text-amber-600',   bg: 'bg-amber-50'   },
          { label: 'Completed Tasks', value: completed, icon: CheckCircle2,   color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon size={20} className={color} />
              </div>
              <div>
                <p className="text-2xl font-bold font-heading text-slate-900">{value}</p>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Skills */}
      {volunteer?.skills?.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 mb-6">
          <h3 className="font-heading font-bold text-slate-800 text-sm mb-3">Your Skills</h3>
          <div className="flex flex-wrap gap-2">
            {volunteer.skills.map(s => (
              <span key={s} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full capitalize">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Recent tasks */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-heading font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList size={16} className="text-slate-400" /> Assigned Tasks
          </h3>
          <Link to="/tasks" className="text-blue-600 text-xs font-semibold flex items-center gap-1 hover:underline">
            View all <ArrowRight size={13} />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center"><LoadingSpinner text="Loading tasks..." /></div>
        ) : tasks.length === 0 ? (
          <div className="py-12 text-center">
            <ClipboardList size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-medium">No tasks assigned yet</p>
            <p className="text-slate-300 text-xs mt-1">Stay active — tasks will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {tasks.slice(0, 5).map(task => (
              <Link key={task.id} to={`/tasks/${task.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors group">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-800 text-sm truncate group-hover:text-blue-600 transition-colors">{task.title}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{task.location_name} · {format(new Date(task.created_at), 'MMM d')}</p>
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${priorityColor[task.priority]}`}>{task.priority}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${statusColor[task.status]}`}>{task.status.replace('_', ' ')}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
