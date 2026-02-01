import { useState } from 'react'
import { authAPI } from '../api'

function Register({ onRegister }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [registering, setRegistering] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password || !email) {
      setError('All fields are required')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    try {
      setRegistering(true)
      setError('')
      setSuccess('')
      
      // Use the create-user endpoint via API helper
      const response = await authAPI.createUser(username, password, email)
      
      if (response.data && response.data.success) {
        setSuccess(`Account created successfully! You can now login as ${username}`)
        setUsername('')
        setPassword('')
        setConfirmPassword('')
        setEmail('')
        if (onRegister) {
          setTimeout(() => {
            onRegister()
          }, 1500)
        }
      } else {
        setError(response.data?.error || 'Failed to create account')
      }
    } catch (err) {
      console.error('Registration error:', err)
      let errorMsg = 'Failed to create account. Please try again.'
      
      if (err.response) {
        // Axios error with response
        const status = err.response.status
        const data = err.response.data
        
        if (status === 400) {
          errorMsg = data?.error || 'Invalid data. Please check your inputs.'
        } else if (status === 500) {
          errorMsg = 'Server error. The backend might be down. Check: https://community-feed-backend.onrender.com'
        } else if (status === 404) {
          errorMsg = 'Endpoint not found. Make sure backend is deployed and running.'
        } else {
          errorMsg = data?.error || `Error ${status}: ${err.response.statusText}`
        }
      } else if (err.code === 'ERR_NETWORK' || err.message?.includes('Network') || err.message?.includes('Failed to fetch')) {
        errorMsg = 'Cannot connect to server. Check if backend is running at: https://community-feed-backend.onrender.com'
      } else if (err.message?.includes('HTML') || err.message?.includes('<!doctype')) {
        errorMsg = 'Backend returned an error page instead of JSON. Check Render logs for errors.'
      } else {
        errorMsg = err.message || 'Failed to create account. Please try again.'
      }
      
      setError(errorMsg)
    } finally {
      setRegistering(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Account</h2>
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
            {success}
          </div>
        )}
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
          required
          minLength={3}
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email (optional)"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
          required
          minLength={6}
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm Password"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
          required
          minLength={6}
        />
        <button
          type="submit"
          disabled={registering || !username || !password || !email}
          className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {registering ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
      <p className="mt-4 text-xs text-gray-500">
        Password must be at least 6 characters long
      </p>
    </div>
  )
}

export default Register
