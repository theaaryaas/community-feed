import { useState } from 'react'
import { postsAPI, commentsAPI } from '../api'

function CommentThread({ comments, postId, onUpdate, depth = 0 }) {
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyContent, setReplyContent] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)
  const [likingComments, setLikingComments] = useState(new Set())

  const handleLike = async (commentId) => {
    if (likingComments.has(commentId)) return
    try {
      setLikingComments((prev) => new Set(prev).add(commentId))
      await commentsAPI.like(commentId)
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Failed to like comment:', error)
    } finally {
      setLikingComments((prev) => {
        const next = new Set(prev)
        next.delete(commentId)
        return next
      })
    }
  }

  const handleSubmitReply = async (e, parentId) => {
    e.preventDefault()
    if (!replyContent.trim() || submittingReply) return

    try {
      setSubmittingReply(true)
      await postsAPI.addComment(postId, replyContent, parentId)
      setReplyContent('')
      setReplyingTo(null)
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Failed to add reply:', error)
    } finally {
      setSubmittingReply(false)
    }
  }

  if (!comments || comments.length === 0) {
    return (
      <div className="text-gray-500 text-sm py-4 text-center">
        No comments yet. Be the first to comment!
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${depth > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
      {comments.map((comment) => (
        <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {comment.author?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">
                  {comment.author?.username || 'Anonymous'}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(comment.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <p className="text-gray-800 text-sm mb-3 whitespace-pre-wrap">{comment.content}</p>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleLike(comment.id)}
              disabled={likingComments.has(comment.id)}
              className={`flex items-center space-x-1 text-sm px-3 py-1 rounded transition-colors ${
                'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } ${likingComments.has(comment.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span>{comment.like_count || 0}</span>
            </button>

            {depth < 5 && (
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 rounded hover:bg-gray-100 transition-colors"
              >
                Reply
              </button>
            )}
          </div>

          {replyingTo === comment.id && (
            <form
              onSubmit={(e) => handleSubmitReply(e, comment.id)}
              className="mt-3 pt-3 border-t border-gray-200"
            >
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="2"
              />
              <div className="flex space-x-2 mt-2">
                <button
                  type="submit"
                  disabled={!replyContent.trim() || submittingReply}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submittingReply ? 'Posting...' : 'Post Reply'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReplyingTo(null)
                    setReplyContent('')
                  }}
                  className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4">
              <CommentThread
                comments={comment.replies}
                postId={postId}
                onUpdate={onUpdate}
                depth={depth + 1}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default CommentThread
