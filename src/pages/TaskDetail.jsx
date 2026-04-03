import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { MapPin, ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react'
import { getTaskById, acceptTask, rejectTask, updateTaskStatus } from '../services/taskService'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const statusColor   = { pending: 'text-slate-600 bg-slate-100', in_progress: 'text-blue-600 bg-blue-50', completed: 'text-emerald-600 bg-emerald-50', cancelled: 'text-red-500 bg-red-50' }
const priorityColor = { low: 'text-slate-500 bg-slate-100', medium: 'text-amber-600 bg-amber-50', high: 'text-orange-600 bg-orange-50', critical: 'text-red-600 bg-red-50' }

export default function TaskDetail() {
  const { id }              = useParams()
  const navigate            = useNavigate()
  const { user, isAdmin }   = useAuth()
  const [task,    setTask]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [acting,  setActing]  = useState(false)

  useEffect(() => {
    getTaskById(id)
      .then(setTask)
      .catch(() => toast.error('Task not found'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleAccept() {
    setActing(true)
    try {
      const updated = await acceptTask(id)
      setTask(t => ({ ...t, ...updated }))
      toast.success('Task accepted!')
    } catch (err) { toast.error(err.message) }
    finally { setActing(false) }
  }

  async function handleReject() {
    setActing(true)
    try {
      await rejectTask(id)
      toast.success('Task rejected')
      navigate('/tasks')
    } catch (err) { toast.error(err.message) }
    finally { setActing(false) }
  }

  async function handleComplete() {
    setActing(true)
    try {
      const updated = await updateTaskStatus(id, 'completed')
      setTask(t => ({ ...t, ...updated }))
      toast.success('Task marked as completed!')
    } catch (err) { toast.error(err.message) }
    finally { setActing(false) }
  }

  if (loading) return <div className="p-8 flex justify-center"><LoadingSpinner text="Loading task..." /></div>
  if (!task)   return <div className="p-8 text-center text-slate-400">Task not found</div>

  const isAssignee = task.assigned_volunteer_id === user?.id
  const canAct     = isAssignee || isAdmin

  return (
    <div className="p-6 max-w-2xl mx-auto fade-in">
      <Link to="/tasks" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-700 text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to tasks
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Priority banner for critical */}
        {task.priority === 'critical' && (
          <div className="bg-red-500 px-5 py-2 text-white text-xs font-bold flex items-center gap-2 animate-pulse">
            🚨 CRITICAL PRIORITY — IMMEDIATE RESPONSE REQUIRED
          </div>
        )}

        <div className="p-6">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${priorityColor[task.priority]}`}>{task.priority}</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColor[task.status]}`}>{task.status.replace('_', ' ')}</span>
          </div>

          <h1 className="font-heading text-2xl font-bold text-slate-900 mb-2">{task.title}</h1>
          {task.description && <p className="text-slate-500 text-sm leading-relaxed mb-5">{task.description}</p>}

          {/* Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl">
              <MapPin size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400 font-medium">Location</p>
                <p className="text-slate-700 text-sm font-semibold">{task.location_name}</p>
                {task.lat && <p className="text-slate-400 text-xs mt-0.5">{task.lat.toFixed(4)}, {task.lng.toFixed(4)}</p>}
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl">
              <Clock size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400 font-medium">Created</p>
                <p className="text-slate-700 text-sm font-semibold">{format(new Date(task.created_at), 'MMM d, yyyy')}</p>
                <p className="text-slate-400 text-xs mt-0.5">{format(new Date(task.created_at), 'h:mm a')}</p>
              </div>
            </div>
          </div>

          {/* Required skills */}
          {task.required_skills?.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Required Skills</p>
              <div className="flex flex-wrap gap-2">
                {task.required_skills.map(s => (
                  <span key={s} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full capitalize">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Assigned volunteer */}
          {task.volunteers && (
            <div className="p-3 bg-emerald-50 rounded-xl mb-5">
              <p className="text-xs font-semibold text-emerald-700 mb-0.5">Assigned To</p>
              <p className="text-sm font-semibold text-emerald-900">{task.volunteers.name}</p>
              <p className="text-xs text-emerald-600">{task.volunteers.email}</p>
            </div>
          )}

          {/* Action buttons */}
          {canAct && task.status !== 'completed' && task.status !== 'cancelled' && (
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              {task.status === 'pending' && isAssignee && (
                <>
                  <button onClick={handleAccept} disabled={acting}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60">
                    <CheckCircle size={16} /> Accept Task
                  </button>
                  <button onClick={handleReject} disabled={acting}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-xl border border-red-200 transition-all disabled:opacity-60">
                    <XCircle size={16} /> Reject
                  </button>
                </>
              )}
              {task.status === 'in_progress' && (
                <button onClick={handleComplete} disabled={acting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60">
                  <CheckCircle size={16} /> Mark as Completed
                </button>
              )}
            </div>
          )}

          {task.status === 'completed' && (
            <div className="mt-4 p-3 bg-emerald-50 rounded-xl text-emerald-700 text-sm font-semibold text-center">
              ✅ Task Completed
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
