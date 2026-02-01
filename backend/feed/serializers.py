from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from .models import Post, Comment, Like, KarmaTransaction


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    class Meta:
        model = User
        fields = ['id', 'username']


class CommentSerializer(serializers.ModelSerializer):
    """Serializer for Comment with nested replies"""
    author = UserSerializer(read_only=True)
    like_count = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()
    depth = serializers.IntegerField(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'author', 'content', 'parent', 'created_at', 'like_count', 'replies', 'depth']
        read_only_fields = ['author', 'created_at']

    def get_like_count(self, obj):
        """Get like count from annotation or property"""
        if hasattr(obj, 'annotated_like_count'):
            return obj.annotated_like_count
        return obj.like_count

    def get_replies(self, obj):
        """Recursively serialize nested replies"""
        if hasattr(obj, '_replies'):
            return CommentSerializer(obj._replies, many=True).data
        return []

    def build_tree(self, comments_dict, parent_id=None):
        """Helper method to build comment tree (not used directly, but kept for reference)"""
        return [
            {
                **CommentSerializer(comment).data,
                'replies': self.build_tree(comments_dict, comment.id)
            }
            for comment in comments_dict.get(parent_id, [])
        ]


class PostSerializer(serializers.ModelSerializer):
    """Serializer for Post with comment tree"""
    author = UserSerializer(read_only=True)
    like_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    comments = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'author', 'content', 'created_at', 'like_count', 'comment_count', 'comments', 'is_liked']
        read_only_fields = ['author', 'created_at']

    def get_like_count(self, obj):
        """Get like count from annotation or property"""
        if hasattr(obj, 'annotated_like_count'):
            return obj.annotated_like_count
        return obj.like_count

    def get_comment_count(self, obj):
        """Get comment count from annotation or property"""
        if hasattr(obj, 'annotated_comment_count'):
            return obj.annotated_comment_count
        return obj.comment_count

    def get_comments(self, obj):
        """Build and return nested comment tree efficiently"""
        if not hasattr(obj, '_prefetched_comments'):
            return []
        
        # Build a dictionary of comments by parent_id
        comments_by_parent = {}
        root_comments = []
        
        for comment in obj._prefetched_comments:
            if comment.parent_id is None:
                root_comments.append(comment)
            else:
                if comment.parent_id not in comments_by_parent:
                    comments_by_parent[comment.parent_id] = []
                comments_by_parent[comment.parent_id].append(comment)
        
        # Attach replies to each comment
        def attach_replies(comment):
            if comment.id in comments_by_parent:
                comment._replies = sorted(comments_by_parent[comment.id], key=lambda x: x.created_at)
                for reply in comment._replies:
                    attach_replies(reply)
            else:
                comment._replies = []
        
        # Build tree starting from root comments
        for root_comment in root_comments:
            attach_replies(root_comment)
        
        return CommentSerializer(root_comments, many=True).data

    def get_is_liked(self, obj):
        """Check if current user has liked this post"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Like.objects.filter(
                user=request.user,
                content_type=ContentType.objects.get_for_model(Post),
                object_id=obj.id
            ).exists()
        return False


class PostListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for post list view"""
    author = UserSerializer(read_only=True)
    like_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'author', 'content', 'created_at', 'like_count', 'comment_count', 'is_liked']

    def get_like_count(self, obj):
        """Get like count from annotation or property"""
        if hasattr(obj, 'annotated_like_count'):
            return obj.annotated_like_count
        return obj.like_count

    def get_comment_count(self, obj):
        """Get comment count from annotation or property"""
        if hasattr(obj, 'annotated_comment_count'):
            return obj.annotated_comment_count
        return obj.comment_count

    def get_is_liked(self, obj):
        """Check if current user has liked this post"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Like.objects.filter(
                user=request.user,
                content_type=ContentType.objects.get_for_model(Post),
                object_id=obj.id
            ).exists()
        return False


class LeaderboardEntrySerializer(serializers.Serializer):
    """Serializer for leaderboard entries"""
    user = UserSerializer()
    total_karma = serializers.IntegerField()
    rank = serializers.IntegerField()
