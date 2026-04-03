import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, MapPin, ChevronRight, Filter } from 'lucide-react'
import { getMyTasks } from '../services/taskService'
import LoadingSpinner from '../components/LoadingSpinner'
import { format } from 'date-fns'

const priorityColor = {
  low:      'text-slate-500 bg-slate-100',
  medium:   'text-amber-600 bg-amber-50',
  high:     'text-orange-600 bg-orange-50',
  critical: 'text-red-600 bg-red-50 animate-pulse',
}
const statusColor = {
  pending:     'text-slate-600 bg-slate-100',
  in_progress: 'text-blue-600 bg-blue-50',
  completed:   'text-emerald-600 bg-emerald-50',
  cancelled:   'text-red-500 bg-red-50',
}

export default function Tasks() {
  const [tasks,   setTasks]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')

  useEffect(() => {
    getMyTasks()
      .then(setTasks)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filters = ['all', 'pending', 'in_progress', 'completed']
  const visible = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)

  return (
    <div className="p-6 max-w-4xl mx-auto fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <ClipboardList size={20} className="text-blue-600" />
        </div>
        <div>
          <h1 className="font-heading text-xl font-bold text-slate-900">My Tasks</h1>
          <p className="text-slate-500 text-sm">{tasks.length} total assigned</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Filter size={14} className="text-slate-400" />
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              filter === f ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><LoadingSpinner text="Loading tasks..." /></div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-100">
          <ClipboardList size={36} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No tasks found</p>
          <p className="text-slate-300 text-sm mt-1">
            {filter === 'all' ? 'No tasks have been assigned to you yet' : `No ${filter.replace('_', ' ')} tasks`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(task => (
            <Link key={task.id} to={`/tasks/${task.id}`} className="block bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${priorityColor[task.priority]}`}>{task.priority}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${statusColor[task.status]}`}>{task.status.replace('_', ' ')}</span>
                  </div>
                  <h3 className="font-heading font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{task.title}</h3>
                  {task.description && <p className="text-slate-400 text-sm mt-1 line-clamp-1">{task.description}</p>}
                  <div className="flex items-center gap-1.5 mt-2">
                    <MapPin size={12} className="text-slate-400" />
                    <span className="text-xs text-slate-400">{task.location_name}</span>
                    <span className="text-slate-200">·</span>
                    <span className="text-xs text-slate-400">{format(new Date(task.created_at), 'MMM d, yyyy')}</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-400 flex-shrink-0 mt-1 transition-colors" />
              </div>
              {task.required_skills?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-50">
                  {task.required_skills.map(s => (
                    <span key={s} className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[11px] rounded-md capitalize">{s}</span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
