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

// Use environment variable for API URL, fallback to relative path
// Automatically add /api if it's missing from the URL
let API_BASE_URL = import.meta.env.VITE_API_URL || '/api'
if (API_BASE_URL && !API_BASE_URL.endsWith('/api')) {
  // If URL doesn't end with /api, add it
  API_BASE_URL = API_BASE_URL.endsWith('/') 
    ? API_BASE_URL + 'api' 
    : API_BASE_URL + '/api'
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Get CSRF token from backend before making POST requests
async function ensureCsrfToken() {
  const csrftoken = getCsrfToken();
  if (!csrftoken) {
    // Try to get CSRF token by making a GET request
    try {
      await api.get('/check-auth/');
      // CSRF token should now be in cookies
    } catch (e) {
      // Ignore errors, just trying to get CSRF token
    }
  }
  return getCsrfToken();
}

// Add CSRF token to all POST/PUT/DELETE requests
api.interceptors.request.use(
  async (config) => {
    if (['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
      const csrftoken = await ensureCsrfToken();
      if (csrftoken) {
        config.headers['X-CSRFToken'] = csrftoken;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
)

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      status: error.response?.status,
      message: error.message,
    })
    return Promise.reject(error);
  }
)

// Log API base URL on initialization (for debugging)
console.log('API Base URL:', API_BASE_URL)

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
