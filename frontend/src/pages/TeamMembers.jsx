import { useState, useEffect } from 'react'
import { teamMemberAPI } from '../services/api'
import { toast } from 'react-toastify'

export default function TeamMembers() {
 const [members, setMembers] = useState([])
 const [showModal, setShowModal] = useState(false)
 const [edit, setEdit] = useState(null)
 const [form, setForm] = useState({ fullName: '', position: '', phone: '', email: '' })

 useEffect(() => { load() }, [])

 const load = async () => { const res = await teamMemberAPI.getAll(); setMembers(res.data) }

 const openCreate = () => { setEdit(null); setForm({ fullName: '', position: '', phone: '', email: '' }); setShowModal(true) }

 const openEdit = (m) => { setEdit(m.id); setForm({ fullName: m.fullName, position: m.position || '', phone: m.phone, email: m.email }); setShowModal(true) }

 const handleSubmit = async (e) => {
 e.preventDefault()
 try {
 if (edit) { await teamMemberAPI.update(edit, form); toast.success('Member updated') }
 else { await teamMemberAPI.create(form); toast.success('Member created') }
 setShowModal(false); load()
 } catch { toast.error('Error saving member') }
 }

 const handleDelete = async (id) => {
 if (!window.confirm('Delete this member?')) return
 try { await teamMemberAPI.delete(id); toast.success('Member deleted'); load() }
 catch { toast.error('Error deleting member') }
 }

 return (
 <div>
 <div className="flex items-center justify-between mb-6">
 <h1 className="text-2xl font-bold text-gray-800">Team Members</h1>
 <button onClick={openCreate} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">+ Add Member</button>
 </div>
 <div className="bg-white rounded-xl shadow overflow-x-auto">
 <table className="w-full text-left">
 <thead className="bg-gray-50 border-b">
 <tr><th className="p-3">Name</th><th className="p-3">Position</th><th className="p-3">Phone</th><th className="p-3">Email</th><th className="p-3">Actions</th></tr>
 </thead>
 <tbody>
 {members.map((m) => (
 <tr key={m.id} className="border-b hover:bg-gray-50:bg-gray-700/50">
 <td className="p-3 font-medium">{m.fullName}</td>
 <td className="p-3">{m.position || '-'}</td>
 <td className="p-3">{m.phone}</td>
 <td className="p-3">{m.email}</td>
 <td className="p-3 space-x-2">
 <button onClick={() => openEdit(m)} className="text-blue-600 hover:underline">Edit</button>
 <button onClick={() => handleDelete(m.id)} className="text-red-600 hover:underline">Delete</button>
 </td>
 </tr>
 ))}
 {members.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-gray-400">No members found</td></tr>}
 </tbody>
 </table>
 </div>
 {showModal && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
 <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
 <h2 className="text-xl font-bold mb-4">{edit ? 'Edit Member' : 'Add Member'}</h2>
 <form onSubmit={handleSubmit} className="space-y-3">
 <input className="w-full border rounded-lg px-4 py-2" placeholder="Full Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
 <input className="w-full border rounded-lg px-4 py-2" placeholder="Position" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
 <div className="grid grid-cols-2 gap-3">
 <input className="border rounded-lg px-4 py-2" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
 <input type="email" className="border rounded-lg px-4 py-2" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
 </div>
 <div className="flex gap-3 pt-2">
 <button type="submit" className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700">Save</button>
 <button type="button" onClick={() => setShowModal(false)} className="bg-gray-200 px-6 py-2 rounded-lg hover:bg-gray-300:bg-gray-600">Cancel</button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 )
}
