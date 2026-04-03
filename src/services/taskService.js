// MS-02 — Task Service
import { supabase } from '../supabaseClient'
import { gatewayCall } from './gateway'
import { haversineDistance } from '../utils/distance'

export const TASK_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled']
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'critical']

export async function createTask({ title, description, location_name, lat, lng, required_skills, priority }) {
  return gatewayCall({
    action: 'CREATE_TASK',
    requireAdmin: true,
    details: { title, priority },
    fn: async (session) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title, description, location_name,
          lat: parseFloat(lat), lng: parseFloat(lng),
          required_skills, priority,
          status: 'pending',
          created_by: session.user.id,
        })
        .select()
        .single()
      if (error) throw error
      return data
    }
  })
}

export async function getAllTasks() {
  return gatewayCall({
    action: 'GET_ALL_TASKS',
    fn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`*, volunteers!tasks_assigned_volunteer_id_fkey(name, email, skills)`)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
  })
}

export async function getMyTasks() {
  return gatewayCall({
    action: 'GET_MY_TASKS',
    fn: async (session) => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_volunteer_id', session.user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
  })
}

export async function getTaskById(taskId) {
  return gatewayCall({
    action: 'GET_TASK',
    targetId: taskId,
    fn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`*, volunteers!tasks_assigned_volunteer_id_fkey(name, email, skills)`)
        .eq('id', taskId)
        .single()
      if (error) throw error
      return data
    }
  })
}

export async function updateTaskStatus(taskId, status) {
  return gatewayCall({
    action: 'UPDATE_TASK_STATUS',
    targetId: taskId,
    details: { status },
    fn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', taskId)
        .select()
        .single()
      if (error) throw error
      return data
    }
  })
}

export async function assignVolunteerToTask(taskId, volunteerId) {
  return gatewayCall({
    action: 'ASSIGN_VOLUNTEER',
    requireAdmin: true,
    targetId: taskId,
    details: { volunteerId },
    fn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          assigned_volunteer_id: volunteerId,
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single()
      if (error) throw error
      return data
    }
  })
}

export async function autoMatchVolunteers(task) {
  return gatewayCall({
    action: 'AUTO_MATCH',
    requireAdmin: true,
    targetId: task.id,
    fn: async () => {
      // Get active volunteers with matching skills
      const { data: volunteers, error } = await supabase
        .from('volunteers')
        .select('*, locations(lat, lng, updated_at)')
        .eq('availability', 'active')
      if (error) throw error

      const scored = volunteers
        .map(v => {
          const skillMatch = (task.required_skills || []).filter(s => (v.skills || []).includes(s)).length
          if (skillMatch === 0) return null

          let distanceKm = Infinity
          if (v.locations?.[0]?.lat && task.lat) {
            distanceKm = haversineDistance(task.lat, task.lng, v.locations[0].lat, v.locations[0].lng)
          }
          return { ...v, skillMatch, distanceKm }
        })
        .filter(Boolean)
        .sort((a, b) => {
          if (b.skillMatch !== a.skillMatch) return b.skillMatch - a.skillMatch
          return a.distanceKm - b.distanceKm
        })

      return scored
    }
  })
}

export async function acceptTask(taskId) {
  return gatewayCall({
    action: 'ACCEPT_TASK',
    targetId: taskId,
    fn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .update({ status: 'in_progress', updated_at: new Date().toISOString() })
        .eq('id', taskId)
        .select()
        .single()
      if (error) throw error
      return data
    }
  })
}

export async function rejectTask(taskId) {
  return gatewayCall({
    action: 'REJECT_TASK',
    targetId: taskId,
    fn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .update({ assigned_volunteer_id: null, status: 'pending', updated_at: new Date().toISOString() })
        .eq('id', taskId)
        .select()
        .single()
      if (error) throw error
      return data
    }
  })
}

export async function deleteTask(taskId) {
  return gatewayCall({
    action: 'DELETE_TASK',
    requireAdmin: true,
    targetId: taskId,
    fn: async () => {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId)
      if (error) throw error
      return true
    }
  })
}
