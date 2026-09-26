import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../services/api'
import { toast } from 'react-toastify'

export default function Login() {
 const [form, setForm] = useState({ username: '', password: '' })
 const [loading, setLoading] = useState(false)
 const { login } = useAuth()
 const navigate = useNavigate()

 const handleSubmit = async (e) => {
 e.preventDefault()
 setLoading(true)
 try {
 const res = await authAPI.login(form)
 login(res.data.token, res.data.message.replace('Login successful as ', ''))
 toast.success('Login successful')
 navigate('/dashboard')
 } catch {
 toast.error('Invalid username or password')
 } finally {
 setLoading(false)
 }
 }

 return (
 <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-gray-900">
 <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
 <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">ProjectMS</h2>
 <p className="text-center text-gray-500 mb-6">Admin Login</p>
 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
 <input
 type="text"
 required
 className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
 value={form.username}
 onChange={(e) => setForm({ ...form, username: e.target.value })}
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
 <input
 type="password"
 required
 className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
 value={form.password}
 onChange={(e) => setForm({ ...form, password: e.target.value })}
 />
 </div>
 <button
 type="submit"
 disabled={loading}
 className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
 >
 {loading ? 'Signing in...' : 'Sign In'}
 </button>
 </form>
 <p className="text-xs text-gray-400 text-center mt-4">Default: admin / admin123</p>
 </div>
 </div>
 )
}
