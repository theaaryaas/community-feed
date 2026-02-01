from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from django.db import transaction
from django.db.models import Prefetch, Q, Count, Sum
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from datetime import timedelta
from .models import Post, Comment, Like, KarmaTransaction
from .serializers import (
    PostSerializer,
    PostListSerializer,
    CommentSerializer,
    LeaderboardEntrySerializer,
    UserSerializer
)


class PostViewSet(viewsets.ModelViewSet):
    """ViewSet for Post model with optimized queries"""
    queryset = Post.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.action == 'list':
            return PostListSerializer
        return PostSerializer

    def get_queryset(self):
        """Optimize queryset to avoid N+1 queries"""
        queryset = Post.objects.select_related('author').prefetch_related(
            Prefetch(
                'likes',
                queryset=Like.objects.select_related('user')
            )
        ).annotate(
            annotated_like_count=Count('likes', distinct=True),
            annotated_comment_count=Count('comments', distinct=True)
        )
        return queryset

    def retrieve(self, request, *args, **kwargs):
        """Retrieve a single post with full comment tree (optimized)"""
        instance = self.get_object()
        
        # Fetch all comments for this post in a single query with all relationships
        comments = Comment.objects.filter(post=instance).select_related(
            'author', 'parent'
        ).prefetch_related(
            Prefetch(
                'likes',
                queryset=Like.objects.select_related('user')
            )
        ).annotate(
            annotated_like_count=Count('likes')
        ).order_by('created_at')
        
        # Attach prefetched comments to instance for serializer
        instance._prefetched_comments = list(comments)
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def perform_create(self, serializer):
        """Create a new post"""
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        """Like or unlike a post with concurrency protection"""
        post = self.get_object()
        user = request.user
        content_type = ContentType.objects.get_for_model(Post)
        
        with transaction.atomic():
            # Use select_for_update to prevent race conditions
            like, created = Like.objects.select_for_update().get_or_create(
                user=user,
                content_type=content_type,
                object_id=post.id,
                defaults={}
            )
            
            if not created:
                # Unlike: delete the like and remove karma
                like.delete()
                # Remove the most recent matching karma transaction (limit to 1 to avoid deleting others' karma)
                karma_tx = KarmaTransaction.objects.filter(
                    user=post.author,
                    content_type=content_type,
                    object_id=post.id,
                    amount=5  # Post like = 5 karma
                ).order_by('-created_at').first()
                if karma_tx:
                    karma_tx.delete()
                return Response({'liked': False, 'message': 'Post unliked'}, status=status.HTTP_200_OK)
            
            # Like: create karma transaction
            KarmaTransaction.objects.create(
                user=post.author,
                amount=5,  # Post like = 5 karma
                content_type=content_type,
                object_id=post.id
            )
            return Response({'liked': True, 'message': 'Post liked'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def comments(self, request, pk=None):
        """Create a comment on a post"""
        post = self.get_object()
        parent_id = request.data.get('parent_id')
        
        # Validate parent if provided
        parent = None
        if parent_id:
            try:
                parent = Comment.objects.get(id=parent_id, post=post)
            except Comment.DoesNotExist:
                return Response(
                    {'error': 'Parent comment not found'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        comment = Comment.objects.create(
            post=post,
            author=request.user,
            content=request.data.get('content'),
            parent=parent
        )
        
        serializer = CommentSerializer(comment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CommentViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Comment model"""
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        """Like or unlike a comment with concurrency protection"""
        comment = self.get_object()
        user = request.user
        content_type = ContentType.objects.get_for_model(Comment)
        
        with transaction.atomic():
            # Use select_for_update to prevent race conditions
            like, created = Like.objects.select_for_update().get_or_create(
                user=user,
                content_type=content_type,
                object_id=comment.id,
                defaults={}
            )
            
            if not created:
                # Unlike: delete the like and remove karma
                like.delete()
                # Remove the most recent matching karma transaction (limit to 1 to avoid deleting others' karma)
                karma_tx = KarmaTransaction.objects.filter(
                    user=comment.author,
                    content_type=content_type,
                    object_id=comment.id,
                    amount=1  # Comment like = 1 karma
                ).order_by('-created_at').first()
                if karma_tx:
                    karma_tx.delete()
                return Response({'liked': False, 'message': 'Comment unliked'}, status=status.HTTP_200_OK)
            
            # Like: create karma transaction
            KarmaTransaction.objects.create(
                user=comment.author,
                amount=1,  # Comment like = 1 karma
                content_type=content_type,
                object_id=comment.id
            )
            return Response({'liked': True, 'message': 'Comment liked'}, status=status.HTTP_201_CREATED)


class LeaderboardViewSet(viewsets.ViewSet):
    """ViewSet for leaderboard"""
    permission_classes = [IsAuthenticatedOrReadOnly]

    def list(self, request):
        """Get top 5 users by karma in last 24 hours"""
        cutoff_time = timezone.now() - timedelta(hours=24)
        
        # Calculate karma for last 24 hours
        leaderboard_data = KarmaTransaction.objects.filter(
            created_at__gte=cutoff_time
        ).values('user').annotate(
            total_karma=Sum('amount')
        ).order_by('-total_karma')[:5]
        
        # Fetch user details
        user_ids = [entry['user'] for entry in leaderboard_data]
        users = {user.id: user for user in User.objects.filter(id__in=user_ids)}
        
        # Build response with rank
        result = []
        for rank, entry in enumerate(leaderboard_data, start=1):
            user = users.get(entry['user'])
            if user:
                result.append({
                    'user': UserSerializer(user).data,
                    'total_karma': entry['total_karma'],
                    'rank': rank
                })
        
        serializer = LeaderboardEntrySerializer(result, many=True)
        return Response(serializer.data)
