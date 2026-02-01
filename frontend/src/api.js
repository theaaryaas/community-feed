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

// Add CSRF token to all POST/PUT/DELETE requests
api.interceptors.request.use(
  async (config) => {
    if (['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
      // Try to get CSRF token from cookies
      let csrftoken = getCsrfToken();
      
      // If no token, try to get it by making a GET request first
      if (!csrftoken) {
        try {
          // Make a simple GET request to get CSRF token
          const response = await fetch(API_BASE_URL + '/check-auth/', {
            method: 'GET',
            credentials: 'include',
          });
          // Token should now be in cookies
          csrftoken = getCsrfToken();
        } catch (e) {
          console.warn('Could not get CSRF token:', e);
        }
      }
      
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

// Add response interceptor for error handling and CSRF token extraction
api.interceptors.response.use(
  (response) => {
    // If response contains CSRF token, store it
    if (response.data?.csrf_token) {
      document.cookie = `csrftoken=${response.data.csrf_token}; path=/; SameSite=None; Secure`
    }
    // Also check response headers
    const csrfHeader = response.headers['x-csrftoken']
    if (csrfHeader) {
      document.cookie = `csrftoken=${csrfHeader}; path=/; SameSite=None; Secure`
    }
    return response;
  },
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
  createUser: (username, password, email) => api.post('/create-user/', { username, password, email }),
}

export default api
