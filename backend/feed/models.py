from django.db import models
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.utils import timezone
from datetime import timedelta


class Post(models.Model):
    """Post model for the community feed"""
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # Generic relation for likes
    likes = GenericRelation('Like', related_query_name='post')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Post by {self.author.username} - {self.content[:50]}"

    @property
    def like_count(self):
        """Get the number of likes on this post"""
        return self.likes.count()

    @property
    def comment_count(self):
        """Get the total number of comments (including nested)"""
        return self.comments.count()


class Comment(models.Model):
    """Comment model with nested threading support"""
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # Generic relation for likes
    likes = GenericRelation('Like', related_query_name='comment')

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author.username} on {self.post.id}"

    @property
    def like_count(self):
        """Get the number of likes on this comment"""
        return self.likes.count()

    def get_depth(self):
        """Calculate the depth of nested comments"""
        depth = 0
        parent = self.parent
        while parent:
            depth += 1
            parent = parent.parent
            if depth > 10:  # Safety limit
                break
        return depth


class Like(models.Model):
    """Generic Like model that can be used for both Posts and Comments"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='likes')
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'content_type', 'object_id']
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
        ]

    def __str__(self):
        return f"{self.user.username} liked {self.content_type.model} {self.object_id}"


class KarmaTransaction(models.Model):
    """Tracks karma changes for leaderboard calculations"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='karma_transactions')
    amount = models.IntegerField()  # +5 for post like, +1 for comment like
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.user.username}: {self.amount:+d} karma at {self.created_at}"

    @classmethod
    def get_24h_karma_by_user(cls):
        """Calculate karma earned in the last 24 hours grouped by user"""
        from django.db.models import Sum
        from django.utils import timezone
        
        cutoff_time = timezone.now() - timedelta(hours=24)
        return cls.objects.filter(
            created_at__gte=cutoff_time
        ).values('user').annotate(
            total_karma=Sum('amount')
        ).order_by('-total_karma')[:5]
