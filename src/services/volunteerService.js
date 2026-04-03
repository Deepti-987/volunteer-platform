// MS-01 — Volunteer Service
import { supabase } from '../supabaseClient'
import { gatewayCall, getSession } from './gateway'

export const SKILL_OPTIONS = [
  'medical', 'rescue', 'logistics', 'communication', 'tech',
  'first_aid', 'search', 'translation', 'engineering', 'psychology'
]

export async function registerVolunteer({ email, password, name }) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error

  if (data.user) {
    const { error: profileError } = await supabase.from('volunteers').insert({
      id: data.user.id,
      name,
      email,
      skills: [],
      availability: 'inactive',
      role: 'volunteer',
    })
    if (profileError) throw profileError
  }
  return data
}

export async function loginVolunteer({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function logoutVolunteer() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getMyProfile() {
  return gatewayCall({
    action: 'GET_PROFILE',
    fn: async (session) => {
      const { data, error } = await supabase
        .from('volunteers')
        .select('*')
        .eq('id', session.user.id)
        .single()
      if (error) throw error
      return data
    }
  })
}

export async function updateMyProfile({ name, skills, availability }) {
  return gatewayCall({
    action: 'UPDATE_PROFILE',
    details: { skills, availability },
    fn: async (session) => {
      const { data, error } = await supabase
        .from('volunteers')
        .update({ name, skills, availability, updated_at: new Date().toISOString() })
        .eq('id', session.user.id)
        .select()
        .single()
      if (error) throw error
      return data
    }
  })
}

export async function toggleAvailability(currentStatus) {
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
  return gatewayCall({
    action: 'TOGGLE_AVAILABILITY',
    details: { newStatus },
    fn: async (session) => {
      const { data, error } = await supabase
        .from('volunteers')
        .update({ availability: newStatus, updated_at: new Date().toISOString() })
        .eq('id', session.user.id)
        .select()
        .single()
      if (error) throw error
      return data
    }
  })
}

export async function getAllVolunteers() {
  return gatewayCall({
    action: 'GET_ALL_VOLUNTEERS',
    requireAdmin: true,
    fn: async () => {
      const { data, error } = await supabase
        .from('volunteers')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
  })
}
