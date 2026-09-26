import { useState, useEffect } from 'react'
import { assignmentAPI, projectAPI, teamMemberAPI } from '../services/api'
import { toast } from 'react-toastify'

export default function Assignments() {
 const [assignments, setAssignments] = useState([])
 const [projects, setProjects] = useState([])
 const [members, setMembers] = useState([])
 const [filterProject, setFilterProject] = useState('')
 const [showModal, setShowModal] = useState(false)
 const [form, setForm] = useState({ projectId: '', teamMemberId: '' })

 useEffect(() => {
 load()
 projectAPI.getAll().then(r => setProjects(r.data))
 teamMemberAPI.getAll().then(r => setMembers(r.data))
 }, [])

 const load = async () => { const res = await assignmentAPI.getAll(); setAssignments(res.data) }

 const filtered = filterProject ? assignments.filter(a => a.projectId === Number(filterProject)) : assignments

 const handleAssign = async (e) => {
 e.preventDefault()
 try {
 await assignmentAPI.create({ projectId: Number(form.projectId), teamMemberId: Number(form.teamMemberId) })
 toast.success('Member assigned')
 setShowModal(false); load()
 } catch { toast.error('Error assigning member') }
 }

 const handleRemove = async (id) => {
 if (!window.confirm('Remove this assignment?')) return
 try { await assignmentAPI.delete(id); toast.success('Assignment removed'); load() }
 catch { toast.error('Error removing assignment') }
 }

 return (
 <div>
 <div className="flex items-center justify-between mb-6">
 <h1 className="text-2xl font-bold text-gray-800">Assignments</h1>
 <button onClick={() => { setForm({ projectId: '', teamMemberId: '' }); setShowModal(true) }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">+ Assign Member</button>
 </div>
 <div className="mb-4">
 <select className="border rounded-lg px-4 py-2" value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
 <option value="">All Projects</option>
 {projects.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}
 </select>
 </div>
 <div className="bg-white rounded-xl shadow overflow-x-auto">
 <table className="w-full text-left">
 <thead className="bg-gray-50 border-b">
 <tr><th className="p-3">Project</th><th className="p-3">Team Member</th><th className="p-3">Assigned Date</th><th className="p-3">Actions</th></tr>
 </thead>
 <tbody>
 {filtered.map((a) => (
 <tr key={a.id} className="border-b hover:bg-gray-50:bg-gray-700/50">
 <td className="p-3 font-medium">{a.projectName}</td>
 <td className="p-3">{a.teamMemberName}</td>
 <td className="p-3">{a.assignedDate || '-'}</td>
 <td className="p-3"><button onClick={() => handleRemove(a.id)} className="text-red-600 hover:underline">Remove</button></td>
 </tr>
 ))}
 {filtered.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-400">No assignments found</td></tr>}
 </tbody>
 </table>
 </div>
 {showModal && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
 <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
 <h2 className="text-xl font-bold mb-4">Assign Member to Project</h2>
 <form onSubmit={handleAssign} className="space-y-3">
 <select className="w-full border rounded-lg px-4 py-2" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} required>
 <option value="">Select Project</option>
 {projects.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}
 </select>
 <select className="w-full border rounded-lg px-4 py-2" value={form.teamMemberId} onChange={(e) => setForm({ ...form, teamMemberId: e.target.value })} required>
 <option value="">Select Team Member</option>
 {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
 </select>
 <div className="flex gap-3 pt-2">
 <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">Assign</button>
 <button type="button" onClick={() => setShowModal(false)} className="bg-gray-200 px-6 py-2 rounded-lg hover:bg-gray-300:bg-gray-600">Cancel</button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 )
}
