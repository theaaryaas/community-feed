from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, CommentViewSet, LeaderboardViewSet
from .auth_views import login_view, logout_view, check_auth, current_user, create_user_view

router = DefaultRouter()
router.register(r'posts', PostViewSet, basename='post')
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'leaderboard', LeaderboardViewSet, basename='leaderboard')

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/login/', login_view, name='login'),
    path('api/logout/', logout_view, name='logout'),
    path('api/check-auth/', check_auth, name='check-auth'),
    path('api/current-user/', current_user, name='current-user'),
    path('api/create-user/', create_user_view, name='create-user'),  # ⚠️ TEMPORARY - Remove after use!
]
