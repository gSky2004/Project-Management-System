import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
 { to: '/dashboard', label: 'Dashboard', icon: '📊' },
 { to: '/projects', label: 'Projects', icon: '📁' },
 { to: '/clients', label: 'Clients', icon: '👥' },
 { to: '/team-members', label: 'Team Members', icon: '👤' },
 { to: '/tasks', label: 'Tasks', icon: '📋' },
 { to: '/assignments', label: 'Assignments', icon: '🔗' },
 { to: '/progress-reports', label: 'Progress Reports', icon: '📈' },
 { to: '/reminders', label: 'Reminders', icon: '⏰' },
]

export default function Sidebar() {
  const { adminName, logout } = useAuth()
 const navigate = useNavigate()

 const handleLogout = () => {
 logout()
 navigate('/')
 }

 return (
 <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white flex flex-col z-40">
 <div className="p-5 border-b border-gray-700">
 <h1 className="text-xl font-bold">ProjectMS</h1>
 <p className="text-sm text-gray-400 mt-1">Welcome, {adminName}</p>
 </div>
 <nav className="flex-1 p-3 space-y-1">
 {links.map((l) => (
 <NavLink
 key={l.to}
 to={l.to}
 end={l.to === '/dashboard'}
 className={({ isActive }) =>
 `flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${
 isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
 }`
 }
 >
 <span>{l.icon}</span>
 <span>{l.label}</span>
 </NavLink>
 ))}
 </nav>
      <div className="p-3 border-t border-gray-700">
        <button
 onClick={handleLogout}
 className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition"
 >
 <span>🚪</span>
 <span>Logout</span>
 </button>
 </div>
 </aside>
 )
}
