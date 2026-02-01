import { useState } from 'react'
import { postsAPI } from '../api'

function CreatePost({ onPostCreated }) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim() || submitting) return

    try {
      setSubmitting(true)
      await postsAPI.create(content)
      setContent('')
      if (onPostCreated) onPostCreated()
    } catch (error) {
      console.error('Failed to create post:', error)
      const errorMessage = error.response?.data?.detail || error.response?.data?.error || 'Failed to create post. Please try again.'
      alert(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Create a Post</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows="4"
        />
        <button
          type="submit"
          disabled={!content.trim() || submitting}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {submitting ? 'Posting...' : 'Post'}
        </button>
      </form>
    </div>
  )
}

export default CreatePost
