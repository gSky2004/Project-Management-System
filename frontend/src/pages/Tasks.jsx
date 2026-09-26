import { useState, useEffect } from 'react'
import { taskAPI, projectAPI, teamMemberAPI } from '../services/api'
import { toast } from 'react-toastify'

export default function Tasks() {
 const [tasks, setTasks] = useState([])
 const [projects, setProjects] = useState([])
 const [members, setMembers] = useState([])
 const [search, setSearch] = useState('')
 const [showModal, setShowModal] = useState(false)
 const [edit, setEdit] = useState(null)
 const [form, setForm] = useState({ taskTitle: '', description: '', priority: 'Medium', dueDate: '', status: 'Pending', projectId: '', assignedMemberId: '' })

 useEffect(() => { load(); projectAPI.getAll().then(r => setProjects(r.data)); teamMemberAPI.getAll().then(r => setMembers(r.data)) }, [])

 const load = async () => { const res = await taskAPI.getAll(); setTasks(res.data) }

 const handleSearch = async () => {
 if (!search.trim()) { load(); return }
 const res = await taskAPI.search(search); setTasks(res.data)
 }

 const openCreate = () => { setEdit(null); setForm({ taskTitle: '', description: '', priority: 'Medium', dueDate: '', status: 'Pending', projectId: '', assignedMemberId: '' }); setShowModal(true) }

 const openEdit = (t) => { setEdit(t.id); setForm({ taskTitle: t.taskTitle, description: t.description || '', priority: t.priority, dueDate: t.dueDate || '', status: t.status, projectId: t.projectId || '', assignedMemberId: t.assignedMemberId || '' }); setShowModal(true) }

 const handleSubmit = async (e) => {
 e.preventDefault()
 const payload = { ...form, projectId: form.projectId ? Number(form.projectId) : null, assignedMemberId: form.assignedMemberId ? Number(form.assignedMemberId) : null }
 try {
 if (edit) { await taskAPI.update(edit, payload); toast.success('Task updated') }
 else { await taskAPI.create(payload); toast.success('Task created') }
 setShowModal(false); load()
 } catch { toast.error('Error saving task') }
 }

 const handleDelete = async (id) => {
 if (!window.confirm('Delete this task?')) return
 try { await taskAPI.delete(id); toast.success('Task deleted'); load() }
 catch { toast.error('Error deleting task') }
 }

 const statusColor = (s) => s === 'Completed' ? 'bg-green-100 text-green-700' : s === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
 const priorityColor = (p) => p === 'High' ? 'text-red-600' : p === 'Medium' ? 'text-orange-600' : 'text-green-600'

 return (
 <div>
 <div className="flex items-center justify-between mb-6">
 <h1 className="text-2xl font-bold text-gray-800">Tasks</h1>
 <button onClick={openCreate} className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">+ Add Task</button>
 </div>
 <div className="flex gap-2 mb-4">
 <input className="flex-1 border rounded-lg px-4 py-2" placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} />
 <button onClick={handleSearch} className="bg-gray-600 text-white px-4 py-2 rounded-lg">Search</button>
 </div>
 <div className="bg-white rounded-xl shadow overflow-x-auto">
 <table className="w-full text-left">
 <thead className="bg-gray-50 border-b">
 <tr><th className="p-3">Title</th><th className="p-3">Priority</th><th className="p-3">Due Date</th><th className="p-3">Status</th><th className="p-3">Project</th><th className="p-3">Assigned To</th><th className="p-3">Actions</th></tr>
 </thead>
 <tbody>
 {tasks.map((t) => (
 <tr key={t.id} className="border-b hover:bg-gray-50:bg-gray-700/50">
 <td className="p-3 font-medium">{t.taskTitle}</td>
 <td className={`p-3 font-semibold ${priorityColor(t.priority)}`}>{t.priority}</td>
 <td className="p-3">{t.dueDate || '-'}</td>
 <td className="p-3"><span className={`px-2 py-1 rounded text-xs font-semibold ${statusColor(t.status)}`}>{t.status}</span></td>
 <td className="p-3">{t.projectName || '-'}</td>
 <td className="p-3">{t.assignedMemberName || '-'}</td>
 <td className="p-3 space-x-2">
 <button onClick={() => openEdit(t)} className="text-blue-600 hover:underline">Edit</button>
 <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:underline">Delete</button>
 </td>
 </tr>
 ))}
 {tasks.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-gray-400">No tasks found</td></tr>}
 </tbody>
 </table>
 </div>
 {showModal && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
 <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
 <h2 className="text-xl font-bold mb-4">{edit ? 'Edit Task' : 'Add Task'}</h2>
 <form onSubmit={handleSubmit} className="space-y-3">
 <input className="w-full border rounded-lg px-4 py-2" placeholder="Task Title" value={form.taskTitle} onChange={(e) => setForm({ ...form, taskTitle: e.target.value })} required />
 <textarea className="w-full border rounded-lg px-4 py-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-sm font-medium text-gray-600 mb-1">Priority</label>
 <select className="w-full border rounded-lg px-4 py-2" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
 <option>Low</option><option>Medium</option><option>High</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-600 mb-1">Due Date</label>
 <input type="date" className="w-full border rounded-lg px-4 py-2" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
 <select className="w-full border rounded-lg px-4 py-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
 <option>Pending</option><option>In Progress</option><option>Completed</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-600 mb-1">Project</label>
 <select className="w-full border rounded-lg px-4 py-2" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
 <option value="">Select Project</option>
 {projects.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}
 </select>
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-600 mb-1">Assign To</label>
 <select className="w-full border rounded-lg px-4 py-2" value={form.assignedMemberId} onChange={(e) => setForm({ ...form, assignedMemberId: e.target.value })}>
 <option value="">Assign to Member</option>
 {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
 </select>
 </div>
 <div className="flex gap-3 pt-2">
 <button type="submit" className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700">Save</button>
 <button type="button" onClick={() => setShowModal(false)} className="bg-gray-200 px-6 py-2 rounded-lg hover:bg-gray-300:bg-gray-600">Cancel</button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 )
}
