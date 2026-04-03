// MS-04 — Notification Service
import { supabase } from '../supabaseClient'
import { gatewayCall } from './gateway'

export async function getMyNotifications() {
  return gatewayCall({
    action: 'GET_NOTIFICATIONS',
    fn: async (session) => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('volunteer_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data
    }
  })
}

export async function getUnreadCount() {
  return gatewayCall({
    action: 'GET_UNREAD_COUNT',
    fn: async (session) => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('volunteer_id', session.user.id)
        .eq('read', false)
      if (error) throw error
      return count
    }
  })
}

export async function markAsRead(notificationId) {
  return gatewayCall({
    action: 'MARK_NOTIFICATION_READ',
    targetId: notificationId,
    fn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .select()
        .single()
      if (error) throw error
      return data
    }
  })
}

export async function markAllAsRead() {
  return gatewayCall({
    action: 'MARK_ALL_READ',
    fn: async (session) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('volunteer_id', session.user.id)
        .eq('read', false)
      if (error) throw error
      return true
    }
  })
}

export async function sendNotification({ volunteerId, title, message, type = 'info' }) {
  return gatewayCall({
    action: 'SEND_NOTIFICATION',
    requireAdmin: true,
    targetId: volunteerId,
    details: { title, type },
    fn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .insert({ volunteer_id: volunteerId, title, message, type, read: false })
        .select()
        .single()
      if (error) throw error
      return data
    }
  })
}

export async function sendBroadcast(message) {
  return gatewayCall({
    action: 'SEND_BROADCAST',
    requireAdmin: true,
    details: { message },
    fn: async (session) => {
      // 1. Save broadcast record
      const { error: broadcastError } = await supabase
        .from('broadcasts')
        .insert({ message, created_by: session.user.id })
      if (broadcastError) throw broadcastError

      // 2. Get all volunteer IDs
      const { data: volunteers, error: volError } = await supabase
        .from('volunteers')
        .select('id')
        .neq('role', 'admin')
      if (volError) throw volError

      // 3. Bulk insert notifications
      const notifications = volunteers.map(v => ({
        volunteer_id: v.id,
        title: '🚨 Emergency Broadcast',
        message,
        type: 'emergency',
        read: false,
      }))

      if (notifications.length > 0) {
        const { error: notifError } = await supabase.from('notifications').insert(notifications)
        if (notifError) throw notifError
      }

      return { sent: notifications.length }
    }
  })
}

export async function getBroadcasts() {
  return gatewayCall({
    action: 'GET_BROADCASTS',
    requireAdmin: true,
    fn: async () => {
      const { data, error } = await supabase
        .from('broadcasts')
        .select(`*, volunteers(name)`)
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return data
    }
  })
}

export function subscribeToNotifications(userId, callback) {
  const channel = supabase.channel(`notif-${userId}-${Math.random().toString(36).slice(2)}`)
  channel
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `volunteer_id=eq.${userId}`
    }, callback)
    .subscribe()
  return channel
}
