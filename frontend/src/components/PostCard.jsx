import { useState } from 'react'
import CommentThread from './CommentThread'
import { postsAPI } from '../api'

function PostCard({ post, onUpdate }) {
  const [showComments, setShowComments] = useState(false)
  const [postData, setPostData] = useState(post)
  const [liking, setLiking] = useState(false)
  const [commentContent, setCommentContent] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  const handleCommentUpdate = async () => {
    if (showComments) {
      await loadFullPost()
    }
    if (onUpdate) onUpdate()
  }

  const loadFullPost = async () => {
    try {
      const response = await postsAPI.getById(postData.id)
      setPostData(response.data)
    } catch (error) {
      console.error('Failed to load post:', error)
    }
  }

  const handleLike = async () => {
    if (liking) return
    try {
      setLiking(true)
      await postsAPI.like(postData.id)
      // Reload post data to get updated like count
      await loadFullPost()
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Failed to like post:', error)
    } finally {
      setLiking(false)
    }
  }

  const handleToggleComments = async () => {
    if (!showComments) {
      // Fetch full post data with comments when opening
      await loadFullPost()
    }
    setShowComments(!showComments)
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!commentContent.trim() || submittingComment) return

    try {
      setSubmittingComment(true)
      await postsAPI.addComment(postData.id, commentContent)
      setCommentContent('')
      // Reload post to get updated comments
      await loadFullPost()
      setShowComments(true)
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setSubmittingComment(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
            {postData.author?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{postData.author?.username || 'Anonymous'}</p>
            <p className="text-sm text-gray-500">
              {new Date(postData.created_at).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <p className="text-gray-800 mb-4 whitespace-pre-wrap">{postData.content}</p>

      <div className="flex items-center space-x-6 border-t border-gray-100 pt-4">
        <button
          onClick={handleLike}
          disabled={liking}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            postData.is_liked
              ? 'bg-red-50 text-red-600 hover:bg-red-100'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          } ${liking ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <svg
            className="w-5 h-5"
            fill={postData.is_liked ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span className="font-medium">{postData.like_count || 0}</span>
        </button>

        <button
          onClick={handleToggleComments}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span className="font-medium">{postData.comment_count || 0}</span>
        </button>
      </div>

      {showComments && (
        <div className="mt-6 border-t border-gray-100 pt-6">
          <form onSubmit={handleSubmitComment} className="mb-6">
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="Write a comment..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="3"
            />
            <button
              type="submit"
              disabled={!commentContent.trim() || submittingComment}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submittingComment ? 'Posting...' : 'Post Comment'}
            </button>
          </form>

          <CommentThread
            comments={postData.comments || []}
            postId={postData.id}
            onUpdate={handleCommentUpdate}
          />
        </div>
      )}
    </div>
  )
}

export default PostCard
