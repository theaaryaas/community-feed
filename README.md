# Community Feed

A full-stack community feed application with threaded discussions and a dynamic leaderboard, built with Django REST Framework and React.

## Features

- **Feed**: Display text posts with author and like counts
- **Threaded Comments**: Nested comment threads (like Reddit)
- **Gamification**: 
  - Post likes = 5 karma
  - Comment likes = 1 karma
- **Leaderboard**: Top 5 users by karma earned in the last 24 hours

## Tech Stack

- **Backend**: Django 5.2, Django REST Framework
- **Frontend**: React, Vite, Tailwind CSS
- **Database**: SQLite (default, can be switched to PostgreSQL)

## Prerequisites

- Python 3.11+
- Node.js 18+
- npm or yarn

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
# Windows
python -m venv venv
.\venv\Scripts\Activate.ps1

# Linux/Mac
python -m venv venv
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install django djangorestframework django-cors-headers
```

4. Run migrations:
```bash
python manage.py migrate
```

5. Create a superuser (for admin access and testing):
```bash
python manage.py createsuperuser
```

   **Note**: To create additional test users for the app, you can:
   - Use Django admin at `http://localhost:8000/admin`
   - Or use Django shell:
   ```bash
   python manage.py shell
   >>> from django.contrib.auth.models import User
   >>> User.objects.create_user('testuser', 'test@example.com', 'password123')
   ```

6. Start the development server:
```bash
python manage.py runserver
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## API Endpoints

- `GET /api/posts/` - List all posts
- `GET /api/posts/{id}/` - Get a post with full comment tree
- `POST /api/posts/` - Create a new post (requires authentication)
- `POST /api/posts/{id}/like/` - Like/unlike a post (requires authentication)
- `POST /api/posts/{id}/comments/` - Add a comment to a post (requires authentication)
- `POST /api/comments/{id}/like/` - Like/unlike a comment (requires authentication)
- `GET /api/leaderboard/` - Get top 5 users by karma (last 24 hours)

## Testing

### Run All Tests

```bash
cd backend
python manage.py test feed.tests
```

### Test Coverage

The test suite includes:

1. **Leaderboard Calculation Tests:**
   - `test_leaderboard_calculates_last_24h_only` - Verifies only last 24 hours are counted
   - `test_leaderboard_top_5_limit` - Ensures only top 5 users are returned
   - `test_leaderboard_api_returns_top_5` - Tests the actual API endpoint
   - `test_leaderboard_api_excludes_old_karma` - Verifies old karma is excluded

2. **Concurrency Tests:**
   - `test_cannot_double_like_post` - Prevents duplicate likes

3. **Nested Comments Tests:**
   - `test_nested_comments_structure` - Verifies comment threading
   - `test_comment_count_includes_nested` - Tests comment counting

4. **Karma Transaction Tests:**
   - `test_post_like_creates_karma_transaction` - Post likes = 5 karma
   - `test_comment_like_creates_karma_transaction` - Comment likes = 1 karma

### Run Specific Test Classes

```bash
# Test only leaderboard
python manage.py test feed.tests.LeaderboardTestCase

# Test only API endpoints
python manage.py test feed.tests.LeaderboardAPITestCase

# Test concurrency
python manage.py test feed.tests.PostLikeConcurrencyTestCase
```

## Docker Setup

### Prerequisites

- Docker Desktop installed
- Docker Compose installed (usually comes with Docker Desktop)

### Quick Start with Docker

1. **Build and start all services:**
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Django Admin: http://localhost:8000/admin

3. **Create a superuser (in a new terminal):**
   ```bash
   docker-compose exec backend python manage.py createsuperuser
   ```

4. **Run tests in Docker:**
   ```bash
   docker-compose exec backend python manage.py test feed.tests
   ```

### Docker Services

The `docker-compose.yml` includes:

- **db**: PostgreSQL 15 database
- **backend**: Django application with auto-migrations
- **frontend**: React development server

### Stop Services

```bash
docker-compose down
```

### Stop and Remove Volumes (Clean Slate)

```bash
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Project Structure

```
.
├── backend/
│   ├── community_feed/    # Django project settings
│   ├── feed/              # Main app
│   │   ├── models.py      # Database models
│   │   ├── views.py       # API views
│   │   ├── serializers.py # DRF serializers
│   │   └── urls.py        # URL routing
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── api.js         # API service layer
│   │   └── App.jsx        # Main app component
│   └── package.json
└── README.md

```

## Notes

- **Authentication**: The app uses Django's built-in session authentication. To test authenticated features (creating posts, comments, likes), you need to:
  1. Create a user (see step 5 above)
  2. Log in via Django admin or implement a login endpoint
  3. The frontend will send session cookies automatically
  
  For a production app, you'd want to implement proper JWT or token-based authentication with login/register endpoints.

- The leaderboard calculates karma dynamically from `KarmaTransaction` records in the last 24 hours.
- Nested comments are optimized to avoid N+1 queries by fetching all comments in a single query and building the tree in memory.
- The app is read-only for unauthenticated users. Authenticated users can create posts, comments, and like content.
