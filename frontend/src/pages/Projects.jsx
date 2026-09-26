import { useState, useEffect } from 'react'
import { projectAPI } from '../services/api'
import { toast } from 'react-toastify'

function daysLeft(endDate) {
 if (!endDate) return null
 const now = new Date(); now.setHours(0, 0, 0, 0)
 const end = new Date(endDate); end.setHours(0, 0, 0, 0)
 return Math.round((end - now) / (1000 * 60 * 60 * 24))
}

export default function Projects() {
 const [projects, setProjects] = useState([])
 const [search, setSearch] = useState('')
 const [showModal, setShowModal] = useState(false)
 const [edit, setEdit] = useState(null)
 const [form, setForm] = useState({ projectName: '', description: '', startDate: '', endDate: '', budget: '', status: 'Planning' })

 useEffect(() => { load() }, [])

 const load = async () => { const res = await projectAPI.getAll(); setProjects(res.data) }

 const handleSearch = async () => {
 if (!search.trim()) { load(); return }
 const res = await projectAPI.search(search)
 setProjects(res.data)
 }

 const openCreate = () => { setEdit(null); setForm({ projectName: '', description: '', startDate: '', endDate: '', budget: '', status: 'Planning' }); setShowModal(true) }

 const openEdit = (p) => {
 setEdit(p.id)
 setForm({ projectName: p.projectName, description: p.description || '', startDate: p.startDate || '', endDate: p.endDate || '', budget: p.budget || '', status: p.status })
 setShowModal(true)
 }

 const handleSubmit = async (e) => {
 e.preventDefault()
 try {
 if (edit) { await projectAPI.update(edit, form); toast.success('Project updated') }
 else { await projectAPI.create(form); toast.success('Project created') }
 setShowModal(false); load()
 } catch { toast.error('Error saving project') }
 }

 const handleDelete = async (id) => {
 if (!window.confirm('Delete this project?')) return
 try { await projectAPI.delete(id); toast.success('Project deleted'); load() }
 catch { toast.error('Error deleting project') }
 }

 const statusColor = (s) => s === 'Completed' ? 'bg-green-100 text-green-700' : s === 'In Progress' ? 'bg-blue-100 text-blue-700' : s === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'

 return (
 <div>
 <div className="flex items-center justify-between mb-6">
 <h1 className="text-2xl font-bold text-gray-800">Projects</h1>
 <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Add Project</button>
 </div>
 <div className="flex gap-2 mb-4">
 <input className="flex-1 border rounded-lg px-4 py-2" placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} />
 <button onClick={handleSearch} className="bg-gray-600 text-white px-4 py-2 rounded-lg">Search</button>
 </div>
 <div className="bg-white rounded-xl shadow overflow-x-auto">
 <table className="w-full text-left">
 <thead className="bg-gray-50 border-b">
 <tr>
 <th className="p-3">Project</th>
 <th className="p-3">Status</th>
 <th className="p-3">Timeline</th>
 <th className="p-3">Time Left</th>
 <th className="p-3">Team</th>
 <th className="p-3">Tasks</th>
 <th className="p-3">Progress</th>
 <th className="p-3">Budget</th>
 <th className="p-3">Actions</th>
 </tr>
 </thead>
 <tbody>
 {projects.map((p) => {
 const days = daysLeft(p.endDate)
 const isOverdue = days !== null && days < 0
 const isNearEnd = days !== null && days >= 0 && days <= 7

 return (
 <tr key={p.id} className="border-b hover:bg-gray-50:bg-gray-700/50">
 <td className="p-3">
 <p className="font-semibold">{p.projectName}</p>
 <p className="text-xs text-gray-400">{p.clientName || 'No client'}</p>
 </td>
 <td className="p-3">
 <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColor(p.status)}`}>{p.status}</span>
 </td>
 <td className="p-3 text-sm whitespace-nowrap">
 {p.startDate || '?'} → {p.endDate || '?'}
 </td>
 <td className="p-3">
 {days === null ? (
 <span className="text-gray-400 text-sm">—</span>
 ) : isOverdue ? (
 <span className="text-red-600 font-semibold text-sm bg-red-50 px-2 py-1 rounded">{Math.abs(days)}d overdue</span>
 ) : isNearEnd ? (
 <span className="text-orange-600 font-semibold text-sm bg-orange-50 px-2 py-1 rounded">{days}d left</span>
 ) : (
 <span className="text-green-600 text-sm">{days}d left</span>
 )}
 </td>
 <td className="p-3">
 <div className="flex flex-wrap gap-1">
 {p.assignedMembers && p.assignedMembers.length > 0 ? (
 p.assignedMembers.map((name, i) => (
 <span key={i} className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">{name}</span>
 ))
 ) : (
 <span className="text-gray-400 text-xs">No members</span>
 )}
 </div>
 </td>
 <td className="p-3 text-sm whitespace-nowrap">
 <span className={p.completedTasks > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}>{p.completedTasks}</span>
 <span className="text-gray-400"> / {p.totalTasks}</span>
 </td>
 <td className="p-3">
 <div className="flex items-center gap-2">
 <div className="w-20 bg-gray-200 rounded-full h-2">
 <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${Math.min(p.completionPercentage, 100)}%` }} />
 </div>
 <span className="text-xs font-semibold text-gray-600">{Math.round(p.completionPercentage)}%</span>
 </div>
 </td>
 <td className="p-3 text-sm font-medium">${p.budget?.toLocaleString() || 0}</td>
 <td className="p-3 space-x-2 whitespace-nowrap">
 <button onClick={() => openEdit(p)} className="text-blue-600 hover:underline text-sm">Edit</button>
 <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline text-sm">Delete</button>
 </td>
 </tr>
 )
 })}
 {projects.length === 0 && <tr><td colSpan={9} className="p-6 text-center text-gray-400">No projects found</td></tr>}
 </tbody>
 </table>
 </div>
 {showModal && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
 <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
 <h2 className="text-xl font-bold mb-4">{edit ? 'Edit Project' : 'Add Project'}</h2>
 <form onSubmit={handleSubmit} className="space-y-3">
 <input className="w-full border rounded-lg px-4 py-2" placeholder="Project Name" value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} required />
 <textarea className="w-full border rounded-lg px-4 py-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
 <input type="date" className="w-full border rounded-lg px-4 py-2" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-600 mb-1">End Date</label>
 <input type="date" className="w-full border rounded-lg px-4 py-2" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-sm font-medium text-gray-600 mb-1">Budget ($)</label>
 <input type="number" step="0.01" className="w-full border rounded-lg px-4 py-2" placeholder="Budget" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
 <select className="w-full border rounded-lg px-4 py-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
 <option>Planning</option><option>In Progress</option><option>Completed</option><option>Cancelled</option>
 </select>
 </div>
 </div>
 <div className="flex gap-3 pt-2">
 <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Save</button>
 <button type="button" onClick={() => setShowModal(false)} className="bg-gray-200 px-6 py-2 rounded-lg hover:bg-gray-300:bg-gray-600">Cancel</button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 )
}
