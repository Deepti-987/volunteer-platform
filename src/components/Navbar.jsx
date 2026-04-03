import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, User, ClipboardList, Map, Bell,
  LogOut, Shield, Users, Settings, Menu, X, Radio, ChevronRight
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { logoutVolunteer } from '../services/volunteerService'
import NotificationBell from './NotificationBell'
import toast from 'react-hot-toast'

const volunteerLinks = [
  { to: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks',          icon: ClipboardList,   label: 'My Tasks'  },
  { to: '/map',            icon: Map,             label: 'Live Map'  },
  { to: '/profile',        icon: User,            label: 'Profile'   },
  { to: '/notifications',  icon: Bell,            label: 'Notifications' },
]

const adminLinks = [
  { to: '/admin',           icon: Shield,         label: 'Admin HQ'      },
  { to: '/admin/tasks',     icon: ClipboardList,  label: 'Manage Tasks'  },
  { to: '/admin/volunteers',icon: Users,          label: 'Volunteers'    },
  { to: '/admin/map',       icon: Map,            label: 'Command Map'   },
]

export default function Navbar() {
  const { volunteer, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    try {
      await logoutVolunteer()
      navigate('/login')
      toast.success('Logged out successfully')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700/50">
        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
          <Radio size={16} className="text-white" />
        </div>
        <div>
          <h1 className="font-heading text-white font-bold text-sm leading-none">VolunteerOps</h1>
          <p className="text-slate-400 text-xs mt-0.5">Volunteer Platform</p>
        </div>
      </div>

      {/* User badge */}
      <div className="mx-3 mt-4 mb-2 p-3 bg-slate-700/40 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-400 font-bold text-sm">
              {volunteer?.name?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{volunteer?.name || 'Volunteer'}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${volunteer?.availability === 'active' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              <span className="text-slate-400 text-xs capitalize">{volunteer?.availability || 'inactive'}</span>
              {isAdmin && <span className="ml-1 px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-medium rounded">ADMIN</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest px-3 py-2">Volunteer</p>
        {volunteerLinks.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group ${
                isActive ? 'active' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
              }`
            }
          >
            <Icon size={17} className="flex-shrink-0" />
            <span className="font-medium">{label}</span>
            <ChevronRight size={13} className="ml-auto opacity-0 group-hover:opacity-40 transition-opacity" />
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest px-3 pt-4 pb-2">Admin</p>
            {adminLinks.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/admin'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group ${
                    isActive ? 'active' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
                  }`
                }
              >
                <Icon size={17} className="flex-shrink-0" />
                <span className="font-medium">{label}</span>
                <ChevronRight size={13} className="ml-auto opacity-0 group-hover:opacity-40 transition-opacity" />
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-slate-700/50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
        >
          <LogOut size={17} />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-slate-900 border-r border-slate-700/50 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile topbar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-slate-900 border-b border-slate-700/50 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-blue-500 flex items-center justify-center">
            <Radio size={13} className="text-white" />
          </div>
          <span className="font-heading font-bold text-white text-sm">VolunteerOps</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button onClick={() => setOpen(true)} className="p-2 text-slate-400 hover:text-white">
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-72 bg-slate-900 h-full overflow-y-auto shadow-2xl">
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white z-10">
              <X size={20} />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop notification bell — top right */}
      <div className="hidden md:flex fixed top-4 right-5 z-20">
        <NotificationBell />
      </div>
    </>
  )
}
