import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, volunteer, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && volunteer?.role !== 'admin') return <Navigate to="/dashboard" replace />

  return children
}
