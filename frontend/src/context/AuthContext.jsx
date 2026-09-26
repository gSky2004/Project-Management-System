import { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [adminName, setAdminName] = useState(localStorage.getItem('adminName'))

  const login = (tokenVal, name) => {
    localStorage.setItem('token', tokenVal)
    localStorage.setItem('adminName', name)
    setToken(tokenVal)
    setAdminName(name)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('adminName')
    setToken(null)
    setAdminName(null)
  }

  const isAuthenticated = !!token

  return (
    <AuthContext.Provider value={{ token, adminName, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
