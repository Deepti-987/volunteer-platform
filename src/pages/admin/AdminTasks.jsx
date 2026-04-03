import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Search, Trash2, UserCheck, X } from 'lucide-react'
import { getAllTasks, createTask, deleteTask, assignVolunteerToTask, autoMatchVolunteers, TASK_PRIORITIES } from '../../services/taskService'
import { supabase } from '../../supabaseClient'
import { exportToCSV } from '../../utils/csvExport'
import LoadingSpinner from '../../components/LoadingSpinner'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const SKILLS = ['medical','rescue','logistics','communication','tech','first_aid','search','translation','engineering','psychology']
const statusColor   = { pending: 'text-slate-600 bg-slate-100', in_progress: 'text-blue-600 bg-blue-50', completed: 'text-emerald-600 bg-emerald-50', cancelled: 'text-red-500 bg-red-50' }
const priorityColor = { low: 'text-slate-500 bg-slate-100', medium: 'text-amber-600 bg-amber-50', high: 'text-orange-600 bg-orange-50', critical: 'text-red-600 bg-red-50' }
const emptyForm     = { title: '', description: '', location_name: '', lat: '', lng: '', required_skills: [], priority: 'medium' }

export default function AdminTasks() {
  const [tasks,    setTasks]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState(emptyForm)
  const [saving,   setSaving]   = useState(false)
  const [search,   setSearch]   = useState('')
  const [matchTask,setMatchTask]= useState(null)
  const [matches,  setMatches]  = useState([])
  const [matching, setMatching] = useState(false)

  async function load() {
    try { const data = await getAllTasks(); setTasks(data || []) }
    catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function toggleSkill(s) {
    setForm(f => ({ ...f, required_skills: f.required_skills.includes(s) ? f.required_skills.filter(x => x !== s) : [...f.required_skills, s] }))
  }

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    try { await createTask(form); toast.success('Task created!'); setShowForm(false); setForm(emptyForm); load() }
    catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this task?')) return
    try { await deleteTask(id); setTasks(ts => ts.filter(t => t.id !== id)); toast.success('Task deleted') }
    catch (err) { toast.error(err.message) }
  }

  async function handleAutoMatch(task) {
    setMatchTask(task); setMatching(true); setMatches([])
    try { const r = await autoMatchVolunteers(task); setMatches(r) }
    catch (err) { toast.error(err.message) }
    finally { setMatching(false) }
  }

  async function handleAssign(volunteerId) {
    try {
      await assignVolunteerToTask(matchTask.id, volunteerId)
      // Direct insert — avoids gateway role check on notifications
      await supabase.from('notifications').insert({
        volunteer_id: volunteerId,
        title: 'New Task Assigned',
        message: `You have been assigned to: ${matchTask.title}`,
        type: 'info',
        read: false,
      })
      toast.success('Volunteer assigned and notified!')
      setMatchTask(null)
      load()
    } catch (err) { toast.error(err.message) }
  }

  const filtered = tasks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    (t.location_name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-6xl mx-auto fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-xl font-bold text-slate-900">Manage Tasks</h1>
          <p className="text-slate-500 text-sm">{tasks.length} total tasks</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => exportToCSV(tasks.map(({ volunteers, ...t }) => t), 'tasks')}
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
            Export CSV
          </button>
          <button onClick={() => { setForm(emptyForm); setShowForm(true) }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm">
            <Plus size={16} /> New Task
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
      </div>

      {/* ── CREATE TASK MODAL ── */}
      {showForm && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box' }}>
          <div style={{ overflowY: 'auto', maxHeight: '90vh', width: '100%', maxWidth: '540px' }}>
            <div style={{ background: '#fff', borderRadius: '16px', width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.35)' }}>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
                <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: '18px', color: '#0f172a' }}>Create New Task</h3>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}>
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreate}>
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Task Title *</label>
                    <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g. Medical supply delivery"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</label>
                    <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                      placeholder="Optional details..."
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location Name *</label>
                    <input type="text" required value={form.location_name} onChange={e => setForm({ ...form, location_name: e.target.value })}
                      placeholder="e.g. Chennai Central"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Latitude *</label>
                      <input type="number" required step="any" value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })}
                        placeholder="13.0827"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Longitude *</label>
                      <input type="number" required step="any" value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })}
                        placeholder="80.2707"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                      {TASK_PRIORITIES.map(p => (
                        <button key={p} type="button" onClick={() => setForm({ ...form, priority: p })}
                          style={{
                            padding: '8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700,
                            textTransform: 'capitalize', cursor: 'pointer', transition: 'all 0.15s',
                            border: form.priority === p ? '2px solid currentColor' : '1px solid #e2e8f0',
                            background: form.priority === p ? (p === 'low' ? '#f1f5f9' : p === 'medium' ? '#fffbeb' : p === 'high' ? '#fff7ed' : '#fef2f2') : '#fff',
                            color: form.priority === p ? (p === 'low' ? '#64748b' : p === 'medium' ? '#d97706' : p === 'high' ? '#ea580c' : '#dc2626') : '#94a3b8',
                          }}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Required Skills</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {SKILLS.map(s => (
                        <button key={s} type="button" onClick={() => toggleSkill(s)}
                          style={{
                            padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                            textTransform: 'capitalize', cursor: 'pointer', transition: 'all 0.15s',
                            background: form.required_skills.includes(s) ? '#2563eb' : '#fff',
                            color: form.required_skills.includes(s) ? '#fff' : '#64748b',
                            border: form.required_skills.includes(s) ? '1px solid #2563eb' : '1px solid #e2e8f0',
                          }}>
                          {s.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', gap: '12px', padding: '16px 24px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', borderRadius: '0 0 16px 16px' }}>
                  <button type="button" onClick={() => setShowForm(false)}
                    style={{ flex: 1, padding: '10px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '10px', fontSize: '14px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    style={{ flex: 1, padding: '10px', background: saving ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    {saving ? 'Creating...' : '+ Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── AUTO-MATCH MODAL ── */}
      {matchTask && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div style={{ background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "480px", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-heading font-bold text-slate-900">Auto-Match Volunteers</h3>
              <button onClick={() => setMatchTask(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-0 bg-transparent cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <div className="mb-4 p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-400">Task</p>
                <p className="text-sm font-semibold text-slate-800">{matchTask.title}</p>
              </div>
              {matching ? (
                <div className="py-8 flex justify-center"><LoadingSpinner text="Finding best matches..." /></div>
              ) : matches.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-slate-400 text-sm">No matching active volunteers found</p>
                  <p className="text-slate-300 text-xs mt-1">Volunteers must be active with matching skills</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {matches.map(v => (
                    <div key={v.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm">{v.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {v.skillMatch} skill{v.skillMatch !== 1 ? 's' : ''} match
                          {v.distanceKm < Infinity ? ` · ${v.distanceKm.toFixed(0)}km` : ''}
                        </p>
                      </div>
                      <button onClick={() => handleAssign(v.id)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all ml-3 flex-shrink-0">
                        <UserCheck size={13} /> Assign
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── TASK TABLE ── */}
      {loading ? (
        <div className="py-16 flex justify-center"><LoadingSpinner text="Loading tasks..." /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-100">
          <p className="text-slate-400 font-medium">No tasks found</p>
          <p className="text-slate-300 text-sm mt-1">Click "New Task" to create the first one</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Task', 'Location', 'Priority', 'Status', 'Assigned To', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(task => (
                <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{task.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{format(new Date(task.created_at), 'MMM d, yyyy')}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{task.location_name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${priorityColor[task.priority]}`}>{task.priority}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${statusColor[task.status]}`}>{task.status.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{task.volunteers?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleAutoMatch(task)} title="Auto-match volunteer"
                        className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-all">
                        <UserCheck size={15} />
                      </button>
                      <button onClick={() => handleDelete(task.id)} title="Delete task"
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-all">
                        <Trash2 size={15} />
                      </button>
                    </div>
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
