import { useState } from 'react'
import { authAPI } from '../api'

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password) return

    try {
      setLoggingIn(true)
      setError('')
      
      // First, try to get CSRF token by checking auth
      try {
        await authAPI.checkAuth()
      } catch (e) {
        // Ignore - just trying to get CSRF token
      }
      
      // Use custom login endpoint
      const response = await authAPI.login(username, password)
      
      if (response.data.success) {
        // Login successful - session cookie is set
        setUsername('')
        setPassword('')
        // Call onLogin callback
        if (onLogin) onLogin()
        // Small delay then reload to ensure session is set
        setTimeout(() => {
          window.location.reload()
        }, 200)
      } else {
        throw new Error('Login failed')
      }
    } catch (err) {
      console.error('Login error:', err)
      const errorMsg = err.response?.data?.error || err.message || 'Invalid username or password'
      setError(errorMsg)
      
      // If it's a network error, provide helpful message
      if (err.code === 'ERR_NETWORK' || err.message.includes('Network')) {
        setError('Cannot connect to server. Please check if backend is running.')
      }
    } finally {
      setLoggingIn(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Login</h2>
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
            {error}
          </div>
        )}
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
          required
        />
        <button
          type="submit"
          disabled={loggingIn || !username || !password}
          className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loggingIn ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  )
}

export default Login
