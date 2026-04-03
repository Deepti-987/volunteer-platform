import { useEffect, useState } from 'react'
import { Bell, CheckCheck, AlertCircle, Info, Zap } from 'lucide-react'
import { getMyNotifications, markAsRead, markAllAsRead } from '../services/notificationService'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

const typeConfig = {
  info:      { icon: Info,         bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-100'   },
  emergency: { icon: AlertCircle,  bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-200'    },
  warning:   { icon: Zap,          bg: 'bg-amber-50',  text: 'text-amber-600',  border: 'border-amber-100'  },
  success:   { icon: CheckCheck,   bg: 'bg-emerald-50',text: 'text-emerald-600',border: 'border-emerald-100'},
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [clearing,      setClearing]      = useState(false)

  async function load() {
    try {
      const data = await getMyNotifications()
      setNotifications(data || [])
    } catch (_) {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleMarkRead(id) {
    try {
      await markAsRead(id)
      setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n))
    } catch (err) { toast.error(err.message) }
  }

  async function handleMarkAllRead() {
    setClearing(true)
    try {
      await markAllAsRead()
      setNotifications(ns => ns.map(n => ({ ...n, read: true })))
      toast.success('All notifications marked as read')
    } catch (err) { toast.error(err.message) }
    finally { setClearing(false) }
  }

  const unread = notifications.filter(n => !n.read).length

  return (
    <div className="p-6 max-w-3xl mx-auto fade-in">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Bell size={20} className="text-blue-600" />
            {unread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unread}
              </span>
            )}
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold text-slate-900">Notifications</h1>
            <p className="text-slate-500 text-sm">{unread} unread</p>
          </div>
        </div>
        {unread > 0 && (
          <button onClick={handleMarkAllRead} disabled={clearing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-60">
            <CheckCheck size={15} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><LoadingSpinner text="Loading notifications..." /></div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-100">
          <Bell size={36} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No notifications yet</p>
          <p className="text-slate-300 text-sm mt-1">You'll see alerts and updates here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const cfg = typeConfig[n.type] || typeConfig.info
            const Icon = cfg.icon
            return (
              <div
                key={n.id}
                onClick={() => !n.read && handleMarkRead(n.id)}
                className={`flex gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                  n.read
                    ? 'bg-white border-slate-100 opacity-70'
                    : `${cfg.bg} ${cfg.border} hover:opacity-90`
                }`}
              >
                <div className={`w-9 h-9 rounded-xl ${n.read ? 'bg-slate-100' : cfg.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={17} className={n.read ? 'text-slate-400' : cfg.text} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className={`font-semibold text-sm ${n.read ? 'text-slate-500' : 'text-slate-900'}`}>{n.title}</h4>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
                  </div>
                  <p className={`text-sm mt-0.5 ${n.read ? 'text-slate-400' : 'text-slate-600'}`}>{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1.5">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
