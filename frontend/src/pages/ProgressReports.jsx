import { useState, useEffect } from 'react'
import { progressReportAPI, projectAPI } from '../services/api'
import { toast } from 'react-toastify'

export default function ProgressReports() {
 const [reports, setReports] = useState([])
 const [projects, setProjects] = useState([])
 const [filterProject, setFilterProject] = useState('')
 const [showModal, setShowModal] = useState(false)
 const [form, setForm] = useState({ projectId: '', progressPercentage: '', remarks: '' })

 useEffect(() => { load(); projectAPI.getAll().then(r => setProjects(r.data)) }, [])

 const load = async () => { const res = await progressReportAPI.getAll(); setReports(res.data) }

 const filtered = filterProject ? reports.filter(r => r.projectId === Number(filterProject)) : reports

 const handleSubmit = async (e) => {
 e.preventDefault()
 try {
 await progressReportAPI.create({ projectId: Number(form.projectId), progressPercentage: Number(form.progressPercentage), remarks: form.remarks })
 toast.success('Report added')
 setShowModal(false); load()
 } catch { toast.error('Error adding report') }
 }

 return (
 <div>
 <div className="flex items-center justify-between mb-6">
 <h1 className="text-2xl font-bold text-gray-800">Progress Reports</h1>
 <button onClick={() => { setForm({ projectId: '', progressPercentage: '', remarks: '' }); setShowModal(true) }} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700">+ Add Report</button>
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
 <tr><th className="p-3">Project</th><th className="p-3">Date</th><th className="p-3">Progress</th><th className="p-3">Remarks</th></tr>
 </thead>
 <tbody>
 {filtered.map((r) => (
 <tr key={r.id} className="border-b hover:bg-gray-50:bg-gray-700/50">
 <td className="p-3 font-medium">{r.projectName}</td>
 <td className="p-3">{r.reportDate || '-'}</td>
 <td className="p-3">
 <div className="flex items-center gap-2">
 <div className="flex-1 bg-gray-200 rounded-full h-2.5 w-24">
 <div className="bg-teal-500 h-2.5 rounded-full" style={{ width: `${Math.min(r.progressPercentage, 100)}%` }} />
 </div>
 <span className="text-sm font-semibold">{Math.round(r.progressPercentage)}%</span>
 </div>
 </td>
 <td className="p-3 text-gray-600">{r.remarks || '-'}</td>
 </tr>
 ))}
 {filtered.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-400">No reports found</td></tr>}
 </tbody>
 </table>
 </div>
 {showModal && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
 <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
 <h2 className="text-xl font-bold mb-4">Add Progress Report</h2>
 <form onSubmit={handleSubmit} className="space-y-3">
 <select className="w-full border rounded-lg px-4 py-2" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} required>
 <option value="">Select Project</option>
 {projects.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}
 </select>
 <div>
 <label className="block text-sm font-medium text-gray-600 mb-1">Progress Percentage</label>
 <input type="number" min="0" max="100" className="w-full border rounded-lg px-4 py-2" value={form.progressPercentage} onChange={(e) => setForm({ ...form, progressPercentage: e.target.value })} required />
 </div>
 <textarea className="w-full border rounded-lg px-4 py-2" placeholder="Remarks" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={3} />
 <div className="flex gap-3 pt-2">
 <button type="submit" className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700">Save</button>
 <button type="button" onClick={() => setShowModal(false)} className="bg-gray-200 px-6 py-2 rounded-lg hover:bg-gray-300:bg-gray-600">Cancel</button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 )
}
