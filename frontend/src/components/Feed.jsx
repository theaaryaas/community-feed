import { useState, useEffect } from 'react'
import PostCard from './PostCard'
import { postsAPI } from '../api'

function Feed({ onUpdate }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    try {
      setLoading(true)
      const response = await postsAPI.getAll()
      // Handle both paginated (results) and non-paginated responses
      const postsData = Array.isArray(response.data) 
        ? response.data 
        : (response.data.results || [])
      setPosts(postsData)
      setError(null)
    } catch (err) {
      setError('Failed to load posts')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = () => {
    loadPosts()
    if (onUpdate) onUpdate()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Loading posts...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <p className="text-red-800">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 mt-6">
      {posts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No posts yet. Be the first to post!
        </div>
      ) : (
        posts.map((post) => (
          <PostCard key={post.id} post={post} onUpdate={handleUpdate} />
        ))
      )}
    </div>
  )
}

export default Feed
