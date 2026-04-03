import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getUnreadCount, subscribeToNotifications } from '../services/notificationService'
import { supabase } from '../supabaseClient'

export default function NotificationBell() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [count, setCount] = useState(0)

  async function loadCount() {
    try {
      const c = await getUnreadCount()
      setCount(c || 0)
    } catch (_) {}
  }

  useEffect(() => {
    if (!user) return
    loadCount()

    const channel = subscribeToNotifications(user.id, () => {
      setCount(prev => prev + 1)
    })

    return () => {
  supabase.removeChannel(channel)
}
  }, [user])

  return (
    <button
      onClick={() => navigate('/notifications')}
      className="relative p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
    >
      <Bell size={20} />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 pulse-dot">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
}