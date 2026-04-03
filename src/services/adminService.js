// MS-05 — Admin Service
import { supabase } from '../supabaseClient'
import { gatewayCall } from './gateway'

export async function getAdminStats() {
  return gatewayCall({
    action: 'GET_ADMIN_STATS',
    requireAdmin: true,
    fn: async () => {
      const [
        { count: totalVolunteers },
        { count: activeVolunteers },
        { data: tasksByStatus },
        { count: totalTasks },
      ] = await Promise.all([
        supabase.from('volunteers').select('*', { count: 'exact', head: true }),
        supabase.from('volunteers').select('*', { count: 'exact', head: true }).eq('availability', 'active'),
        supabase.from('tasks').select('status'),
        supabase.from('tasks').select('*', { count: 'exact', head: true }),
      ])

      const statusCounts = { pending: 0, in_progress: 0, completed: 0, cancelled: 0 }
      ;(tasksByStatus || []).forEach(t => {
        if (statusCounts[t.status] !== undefined) statusCounts[t.status]++
      })

      return {
        totalVolunteers: totalVolunteers || 0,
        activeVolunteers: activeVolunteers || 0,
        totalTasks: totalTasks || 0,
        tasksByStatus: statusCounts,
      }
    }
  })
}

export async function getAdminLogs(limit = 50) {
  return gatewayCall({
    action: 'GET_ADMIN_LOGS',
    requireAdmin: true,
    fn: async () => {
      const { data, error } = await supabase
        .from('admin_logs')
        .select(`*, volunteers(name, email)`)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data
    }
  })
}

export async function setVolunteerRole(volunteerId, role) {
  return gatewayCall({
    action: 'SET_VOLUNTEER_ROLE',
    requireAdmin: true,
    targetId: volunteerId,
    details: { role },
    fn: async () => {
      const { data, error } = await supabase
        .from('volunteers')
        .update({ role })
        .eq('id', volunteerId)
        .select()
        .single()
      if (error) throw error
      return data
    }
  })
}
