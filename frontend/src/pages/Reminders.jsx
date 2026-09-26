import { useState, useEffect } from 'react'
import { taskAPI } from '../services/api'

function daysBetween(dateStr) {
 const now = new Date(); now.setHours(0, 0, 0, 0)
 const due = new Date(dateStr); due.setHours(0, 0, 0, 0)
 return Math.round((due - now) / (1000 * 60 * 60 * 24))
}

export default function Reminders() {
 const [tasks, setTasks] = useState([])

 useEffect(() => {
 taskAPI.getAll().then((res) => setTasks(res.data)).catch(() => {})
 }, [])

 const now = new Date(); now.setHours(0, 0, 0, 0)

 const overdueTasks = tasks.filter(t => t.dueDate && t.status !== 'Completed' && new Date(t.dueDate) < now)
 .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))

 const dueSoonTasks = tasks.filter(t => {
 if (!t.dueDate || t.status === 'Completed') return false
 const days = daysBetween(t.dueDate)
 return days >= 0 && days <= 3
 }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))

 const onTimeTasks = tasks.filter(t => {
 if (!t.dueDate || t.status === 'Completed') return false
 const days = daysBetween(t.dueDate)
 return days > 3
 }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))

 return (
 <div>
 <h1 className="text-2xl font-bold text-gray-800 mb-6">Reminders & Overdue Tasks</h1>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <div className="bg-white rounded-xl p-6 shadow border-l-4 border-red-500">
 <h2 className="text-lg font-semibold text-red-700 mb-3 flex items-center gap-2">
 <span className="w-3 h-3 bg-red-500 rounded-full inline-block" />
 Overdue Tasks ({overdueTasks.length})
 </h2>
 {overdueTasks.length === 0 ? (
 <p className="text-gray-400 text-sm py-4 text-center">No overdue tasks — good job!</p>
 ) : (
 <div className="space-y-2">
 {overdueTasks.map(t => {
 const days = daysBetween(t.dueDate)
 return (
 <div key={t.id} className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-4 py-3">
 <div>
 <p className="font-medium text-sm text-red-800">{t.taskTitle}</p>
 <p className="text-xs text-red-500 mt-0.5">
 {t.projectName || 'No project'} — {t.assignedMemberName || 'Unassigned'}
 </p>
 <p className="text-xs text-red-400">Due: {t.dueDate}</p>
 </div>
 <span className="text-sm font-bold text-red-600 whitespace-nowrap bg-red-100 px-3 py-1 rounded-full">
 {Math.abs(days)}d overdue
 </span>
 </div>
 )
 })}
 </div>
 )}
 </div>

 <div className="bg-white rounded-xl p-6 shadow border-l-4 border-orange-400">
 <h2 className="text-lg font-semibold text-orange-700 mb-3 flex items-center gap-2">
 <span className="w-3 h-3 bg-orange-400 rounded-full inline-block" />
 Due Soon — Reminders ({dueSoonTasks.length})
 </h2>
 {dueSoonTasks.length === 0 ? (
 <p className="text-gray-400 text-sm py-4 text-center">No tasks due in the next 3 days</p>
 ) : (
 <div className="space-y-2">
 {dueSoonTasks.map(t => {
 const days = daysBetween(t.dueDate)
 return (
 <div key={t.id} className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
 <div>
 <p className="font-medium text-sm text-orange-800">{t.taskTitle}</p>
 <p className="text-xs text-orange-500 mt-0.5">
 {t.projectName || 'No project'} — {t.assignedMemberName || 'Unassigned'}
 </p>
 <p className="text-xs text-orange-400">Due: {t.dueDate}</p>
 </div>
 <span className="text-sm font-bold text-orange-600 whitespace-nowrap bg-orange-100 px-3 py-1 rounded-full">
 {days === 0 ? 'Due today' : days === 1 ? '1 day left' : `${days} days left`}
 </span>
 </div>
 )
 })}
 </div>
 )}
 </div>

 <div className="bg-white rounded-xl p-6 shadow border-l-4 border-green-400 lg:col-span-2">
 <h2 className="text-lg font-semibold text-green-700 mb-3 flex items-center gap-2">
 <span className="w-3 h-3 bg-green-400 rounded-full inline-block" />
 On Track ({onTimeTasks.length})
 </h2>
 {onTimeTasks.length === 0 ? (
 <p className="text-gray-400 text-sm py-4 text-center">No upcoming tasks with deadlines</p>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
 {onTimeTasks.map(t => {
 const days = daysBetween(t.dueDate)
 return (
 <div key={t.id} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
 <div className="min-w-0 flex-1">
 <p className="font-medium text-sm text-green-800 truncate">{t.taskTitle}</p>
 <p className="text-xs text-green-500">{t.projectName}</p>
 </div>
 <span className="text-xs font-semibold text-green-600 whitespace-nowrap ml-2">{days} days left</span>
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
