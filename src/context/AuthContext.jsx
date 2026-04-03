import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null)
  const [volunteer, setVolunteer] = useState(null)
  const [loading, setLoading]     = useState(true)

  async function fetchVolunteer(userId) {
    const { data } = await supabase
      .from('volunteers')
      .select('*')
      .eq('id', userId)
      .single()
    setVolunteer(data)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchVolunteer(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchVolunteer(session.user.id)
      else setVolunteer(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const isAdmin = volunteer?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, volunteer, setVolunteer, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
