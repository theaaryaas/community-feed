import axios from 'axios'

// Helper function to get CSRF token from cookies
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// Get CSRF token
function getCsrfToken() {
  return getCookie('csrftoken');
}

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add CSRF token to all POST/PUT/DELETE requests
api.interceptors.request.use(
  (config) => {
    const csrftoken = getCsrfToken();
    if (csrftoken && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
      config.headers['X-CSRFToken'] = csrftoken;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
)

export const postsAPI = {
  getAll: () => api.get('/posts/'),
  getById: (id) => api.get(`/posts/${id}/`),
  create: (content) => api.post('/posts/', { content }),
  like: (id) => api.post(`/posts/${id}/like/`),
  addComment: (postId, content, parentId = null) =>
    api.post(`/posts/${postId}/comments/`, { content, parent_id: parentId }),
}

export const commentsAPI = {
  like: (id) => api.post(`/comments/${id}/like/`),
}

export const leaderboardAPI = {
  getTop5: () => api.get('/leaderboard/'),
}

export const authAPI = {
  login: (username, password) => api.post('/login/', { username, password }),
  logout: () => api.post('/logout/'),
  checkAuth: () => api.get('/check-auth/'),
  getCurrentUser: () => api.get('/current-user/'),
}

export default api
