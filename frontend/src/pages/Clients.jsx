import { useState, useEffect } from 'react'
import { clientAPI } from '../services/api'
import { toast } from 'react-toastify'

export default function Clients() {
 const [clients, setClients] = useState([])
 const [search, setSearch] = useState('')
 const [showModal, setShowModal] = useState(false)
 const [edit, setEdit] = useState(null)
 const [form, setForm] = useState({ clientName: '', companyName: '', phone: '', email: '', address: '' })

 useEffect(() => { load() }, [])

 const load = async () => { const res = await clientAPI.getAll(); setClients(res.data) }

 const handleSearch = async () => {
 if (!search.trim()) { load(); return }
 const res = await clientAPI.search(search); setClients(res.data)
 }

 const openCreate = () => { setEdit(null); setForm({ clientName: '', companyName: '', phone: '', email: '', address: '' }); setShowModal(true) }

 const openEdit = (c) => { setEdit(c.id); setForm({ clientName: c.clientName, companyName: c.companyName || '', phone: c.phone, email: c.email, address: c.address || '' }); setShowModal(true) }

 const handleSubmit = async (e) => {
 e.preventDefault()
 try {
 if (edit) { await clientAPI.update(edit, form); toast.success('Client updated') }
 else { await clientAPI.create(form); toast.success('Client created') }
 setShowModal(false); load()
 } catch { toast.error('Error saving client') }
 }

 const handleDelete = async (id) => {
 if (!window.confirm('Delete this client?')) return
 try { await clientAPI.delete(id); toast.success('Client deleted'); load() }
 catch { toast.error('Error deleting client') }
 }

 return (
 <div>
 <div className="flex items-center justify-between mb-6">
 <h1 className="text-2xl font-bold text-gray-800">Clients</h1>
 <button onClick={openCreate} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">+ Add Client</button>
 </div>
 <div className="flex gap-2 mb-4">
 <input className="flex-1 border rounded-lg px-4 py-2" placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} />
 <button onClick={handleSearch} className="bg-gray-600 text-white px-4 py-2 rounded-lg">Search</button>
 </div>
 <div className="bg-white rounded-xl shadow overflow-x-auto">
 <table className="w-full text-left">
 <thead className="bg-gray-50 border-b">
 <tr><th className="p-3">Name</th><th className="p-3">Company</th><th className="p-3">Phone</th><th className="p-3">Email</th><th className="p-3">Actions</th></tr>
 </thead>
 <tbody>
 {clients.map((c) => (
 <tr key={c.id} className="border-b hover:bg-gray-50:bg-gray-700/50">
 <td className="p-3 font-medium">{c.clientName}</td>
 <td className="p-3">{c.companyName || '-'}</td>
 <td className="p-3">{c.phone}</td>
 <td className="p-3">{c.email}</td>
 <td className="p-3 space-x-2">
 <button onClick={() => openEdit(c)} className="text-blue-600 hover:underline">Edit</button>
 <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:underline">Delete</button>
 </td>
 </tr>
 ))}
 {clients.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-gray-400">No clients found</td></tr>}
 </tbody>
 </table>
 </div>
 {showModal && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
 <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
 <h2 className="text-xl font-bold mb-4">{edit ? 'Edit Client' : 'Add Client'}</h2>
 <form onSubmit={handleSubmit} className="space-y-3">
 <input className="w-full border rounded-lg px-4 py-2" placeholder="Client Name" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} required />
 <input className="w-full border rounded-lg px-4 py-2" placeholder="Company Name" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
 <div className="grid grid-cols-2 gap-3">
 <input className="border rounded-lg px-4 py-2" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
 <input type="email" className="border rounded-lg px-4 py-2" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
 </div>
 <textarea className="w-full border rounded-lg px-4 py-2" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} />
 <div className="flex gap-3 pt-2">
 <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">Save</button>
 <button type="button" onClick={() => setShowModal(false)} className="bg-gray-200 px-6 py-2 rounded-lg hover:bg-gray-300:bg-gray-600">Cancel</button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 )
}
