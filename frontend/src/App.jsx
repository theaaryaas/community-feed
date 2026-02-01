import { useState, useEffect } from 'react'
import Feed from './components/Feed'
import Leaderboard from './components/Leaderboard'
import CreatePost from './components/CreatePost'
import Login from './components/Login'
import Register from './components/Register'
import { leaderboardAPI, authAPI } from './api'

function App() {
  const [leaderboard, setLeaderboard] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [showRegister, setShowRegister] = useState(false)

  useEffect(() => {
    checkAuth()
    loadLeaderboard()
    const interval = setInterval(loadLeaderboard, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const checkAuth = async () => {
    try {
      const response = await authAPI.checkAuth()
      setIsAuthenticated(response.data.authenticated)
      if (response.data.authenticated && response.data.user) {
        setCurrentUser(response.data.user)
      } else {
        setCurrentUser(null)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setIsAuthenticated(false)
      setCurrentUser(null)
    } finally {
      setCheckingAuth(false)
    }
  }

  const handleLogin = () => {
    setIsAuthenticated(true)
    checkAuth()
  }

  const handleRegister = () => {
    // After registration, switch to login
    setShowRegister(false)
    checkAuth()
  }

  const handleLogout = async () => {
    try {
      await authAPI.logout()
      setIsAuthenticated(false)
      setCurrentUser(null)
      // Refresh the page to clear any cached state
      window.location.reload()
    } catch (error) {
      console.error('Logout error:', error)
      // Even if logout fails, clear local state
      setIsAuthenticated(false)
      setCurrentUser(null)
      window.location.reload()
    }
  }

  const loadLeaderboard = async () => {
    try {
      const response = await leaderboardAPI.getTop5()
      setLeaderboard(response.data)
    } catch (error) {
      console.error('Failed to load leaderboard:', error)
    }
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
    loadLeaderboard()
  }

  return (
    <div className="min-h-screen app-background">
      <div className="app-background-overlay"></div>
      <div className="app-background-content">
        <header className="bg-gradient-to-r from-blue-600 to-purple-600 bg-opacity-95 shadow-lg border-b backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-white">Community Feed</h1>
              {isAuthenticated && currentUser && (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {currentUser.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-medium text-white">
                      {currentUser.username}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium text-white bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors backdrop-blur-sm"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            {checkingAuth ? (
              <div className="text-center py-8 text-gray-500">Checking authentication...</div>
            ) : !isAuthenticated ? (
              <>
                {showRegister ? (
                  <Register onRegister={handleRegister} />
                ) : (
                  <Login onLogin={handleLogin} />
                )}
                <div className="text-center mt-4">
                  {showRegister ? (
                    <p className="text-sm text-gray-600">
                      Already have an account?{' '}
                      <button
                        onClick={() => setShowRegister(false)}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        Login here
                      </button>
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Don't have an account?{' '}
                      <button
                        onClick={() => setShowRegister(true)}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        Create one here
                      </button>
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <CreatePost onPostCreated={handleRefresh} />
                <Feed key={refreshKey} onUpdate={handleRefresh} />
              </>
            )}
            {/* Debug info - remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-2 bg-gray-100 text-xs text-gray-600">
                API URL: {import.meta.env.VITE_API_URL || '/api (relative)'}
              </div>
            )}
          </div>
          <div className="lg:col-span-1">
            <Leaderboard data={leaderboard} />
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

export default App
