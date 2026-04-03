import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'

import Login          from './pages/Login'
import Register       from './pages/Register'
import Dashboard      from './pages/Dashboard'
import Profile        from './pages/Profile'
import Tasks          from './pages/Tasks'
import TaskDetail     from './pages/TaskDetail'
import MapPage        from './pages/Map'
import Notifications  from './pages/Notifications'

import AdminDashboard  from './pages/admin/AdminDashboard'
import AdminTasks      from './pages/admin/AdminTasks'
import AdminVolunteers from './pages/admin/AdminVolunteers'
import AdminMap        from './pages/admin/AdminMap'

function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navbar />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { fontFamily: 'Inter, sans-serif', fontSize: '14px', borderRadius: '10px' },
            success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Volunteer routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>
          } />
          <Route path="/tasks" element={
            <ProtectedRoute><AppLayout><Tasks /></AppLayout></ProtectedRoute>
          } />
          <Route path="/tasks/:id" element={
            <ProtectedRoute><AppLayout><TaskDetail /></AppLayout></ProtectedRoute>
          } />
          <Route path="/map" element={
            <ProtectedRoute><AppLayout><MapPage /></AppLayout></ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute><AppLayout><Notifications /></AppLayout></ProtectedRoute>
          } />

          {/* Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly><AppLayout><AdminDashboard /></AppLayout></ProtectedRoute>
          } />
          <Route path="/admin/tasks" element={
            <ProtectedRoute adminOnly><AppLayout><AdminTasks /></AppLayout></ProtectedRoute>
          } />
          <Route path="/admin/volunteers" element={
            <ProtectedRoute adminOnly><AppLayout><AdminVolunteers /></AppLayout></ProtectedRoute>
          } />
          <Route path="/admin/map" element={
            <ProtectedRoute adminOnly><AppLayout><AdminMap /></AppLayout></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
