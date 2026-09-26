import { useState, useEffect } from 'react'
import { dashboardAPI, taskAPI } from '../services/api'

const cards = [
 { key: 'totalProjects', label: 'Total Projects', color: 'bg-blue-500' },
 { key: 'totalClients', label: 'Total Clients', color: 'bg-green-500' },
 { key: 'totalTeamMembers', label: 'Team Members', color: 'bg-purple-500' },
 { key: 'totalTasks', label: 'Total Tasks', color: 'bg-orange-500' },
 { key: 'completedProjects', label: 'Completed Projects', color: 'bg-teal-500' },
 { key: 'ongoingProjects', label: 'Ongoing Projects', color: 'bg-indigo-500' },
 { key: 'overdueTasks', label: 'Overdue Tasks', color: 'bg-red-500' },
]

function daysBetween(dateStr) {
 const now = new Date()
 now.setHours(0, 0, 0, 0)
 const due = new Date(dateStr)
 due.setHours(0, 0, 0, 0)
 return Math.round((due - now) / (1000 * 60 * 60 * 24))
}

export default function Dashboard() {
 const [data, setData] = useState(null)
 const [tasks, setTasks] = useState([])

 useEffect(() => {
 dashboardAPI.get().then((res) => setData(res.data)).catch(() => {})
 taskAPI.getAll().then((res) => { console.log('Tasks loaded:', res.data); setTasks(res.data) }).catch((e) => console.error('Tasks fetch failed:', e))
 }, [])

 if (!data) return <div className="text-center py-20 text-gray-500">Loading...</div>

 const now = new Date()
 now.setHours(0, 0, 0, 0)

 const overdueTasks = tasks.filter(t => t.dueDate && t.status !== 'Completed' && new Date(t.dueDate) < now)
 .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))

 const dueSoonTasks = tasks.filter(t => {
 if (!t.dueDate || t.status === 'Completed') return false
 const days = daysBetween(t.dueDate)
 return days >= 0 && days <= 3
 }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))

 return (
 <div>
 <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
 {cards.map((c) => (
 <div key={c.key} className={`${c.color} rounded-xl p-5 text-white shadow`}>
 <p className="text-sm opacity-80">{c.label}</p>
 <p className="text-3xl font-bold mt-1">{data[c.key] ?? 0}</p>
 </div>
 ))}
 </div>

 <div className="mt-6 bg-white rounded-xl p-6 shadow">
 <h2 className="text-lg font-semibold text-gray-700 mb-2">Project Completion</h2>
 <div className="flex items-center gap-4">
 <div className="flex-1 bg-gray-200 rounded-full h-4">
 <div
 className="bg-blue-600 h-4 rounded-full transition-all"
 style={{ width: `${Math.min(data.projectCompletionPercentage, 100)}%` }}
 />
 </div>
 <span className="text-xl font-bold text-blue-600">{Math.round(data.projectCompletionPercentage)}%</span>
 </div>
 </div>

 <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
 <div className="bg-white rounded-xl p-6 shadow">
 <h2 className="text-lg font-semibold text-red-700 mb-3 flex items-center gap-2">
 <span className="w-2.5 h-2.5 bg-red-500 rounded-full inline-block" />
 Overdue Tasks ({overdueTasks.length})
 </h2>
 {overdueTasks.length === 0 ? (
 <p className="text-gray-400 text-sm">No overdue tasks</p>
 ) : (
 <div className="space-y-2 max-h-64 overflow-y-auto">
 {overdueTasks.map(t => {
 const days = daysBetween(t.dueDate)
 return (
 <div key={t.id} className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
 <div>
 <p className="font-medium text-sm text-red-800">{t.taskTitle}</p>
 <p className="text-xs text-red-600">{t.projectName} - {t.assignedMemberName || 'Unassigned'}</p>
 </div>
 <span className="text-sm font-bold text-red-600 whitespace-nowrap">{Math.abs(days)}d overdue</span>
 </div>
 )
 })}
 </div>
 )}
 </div>

 <div className="bg-white rounded-xl p-6 shadow">
 <h2 className="text-lg font-semibold text-orange-700 mb-3 flex items-center gap-2">
 <span className="w-2.5 h-2.5 bg-orange-400 rounded-full inline-block" />
 Due Soon — Reminders ({dueSoonTasks.length})
 </h2>
 {dueSoonTasks.length === 0 ? (
 <p className="text-gray-400 text-sm">No tasks due soon</p>
 ) : (
 <div className="space-y-2 max-h-64 overflow-y-auto">
 {dueSoonTasks.map(t => {
 const days = daysBetween(t.dueDate)
 return (
 <div key={t.id} className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg px-4 py-2.5">
 <div>
 <p className="font-medium text-sm text-orange-800">{t.taskTitle}</p>
 <p className="text-xs text-orange-600">{t.projectName} - {t.assignedMemberName || 'Unassigned'}</p>
 </div>
 <span className="text-sm font-bold text-orange-600 whitespace-nowrap">
 {days === 0 ? 'Due today' : days === 1 ? '1 day left' : `${days} days left`}
 </span>
 </div>
 )
 })}
 </div>
 )}
 </div>
 </div>
 </div>
 )
}
