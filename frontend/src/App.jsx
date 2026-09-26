import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Clients from './pages/Clients'
import TeamMembers from './pages/TeamMembers'
import Tasks from './pages/Tasks'
import Assignments from './pages/Assignments'
import ProgressReports from './pages/ProgressReports'
import Reminders from './pages/Reminders'
import Sidebar from './components/Sidebar'

function PrivateRoute({ children }) {
 const { isAuthenticated } = useAuth()
 return isAuthenticated ? children : <Navigate to="/login" replace />
}

function Layout({ children }) {
 return (
  <div className="flex min-h-screen bg-gray-100">
 <Sidebar />
 <main className="flex-1 p-6 ml-64">{children}</main>
 </div>
 )
}

function App() {
 return (
 <AuthProvider>
 <Routes>
 <Route path="/" element={<Login />} />
 <Route path="/dashboard" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
 <Route path="/projects" element={<PrivateRoute><Layout><Projects /></Layout></PrivateRoute>} />
 <Route path="/clients" element={<PrivateRoute><Layout><Clients /></Layout></PrivateRoute>} />
 <Route path="/team-members" element={<PrivateRoute><Layout><TeamMembers /></Layout></PrivateRoute>} />
 <Route path="/tasks" element={<PrivateRoute><Layout><Tasks /></Layout></PrivateRoute>} />
 <Route path="/assignments" element={<PrivateRoute><Layout><Assignments /></Layout></PrivateRoute>} />
 <Route path="/progress-reports" element={<PrivateRoute><Layout><ProgressReports /></Layout></PrivateRoute>} />
 <Route path="/reminders" element={<PrivateRoute><Layout><Reminders /></Layout></PrivateRoute>} />
 <Route path="*" element={<Navigate to="/" replace />} />
 </Routes>
 </AuthProvider>
 )
}

export default App
