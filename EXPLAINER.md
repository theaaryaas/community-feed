# Technical Deep-Dive: Community Feed Implementation

This document explains the key technical decisions and implementations in the Community Feed project.

## 1. The Tree: Nested Comments Implementation

### Database Model

Comments are modeled using a self-referential foreign key:

```python
class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    created_at = models.DateTimeField(auto_now_add=True)
```

This allows unlimited nesting depth while maintaining referential integrity.

### Avoiding N+1 Queries

The critical challenge: loading a post with 50 nested comments should not trigger 50+ SQL queries.

**Solution**: Fetch all comments in a single query, then build the tree in Python:

```python
# In PostViewSet.retrieve()
comments = Comment.objects.filter(post=instance).select_related(
    'author', 'parent'
).prefetch_related(
    Prefetch('likes', queryset=Like.objects.select_related('user'))
).annotate(like_count=Count('likes')).order_by('created_at')

# Attach to instance for serializer
instance._prefetched_comments = list(comments)
```

**Tree Building in Serializer**:

```python
def get_comments(self, obj):
    # Build dictionary of comments by parent_id
    comments_by_parent = {}
    root_comments = []
    
    for comment in obj._prefetched_comments:
        if comment.parent_id is None:
            root_comments.append(comment)
        else:
            if comment.parent_id not in comments_by_parent:
                comments_by_parent[comment.parent_id] = []
            comments_by_parent[comment.parent_id].append(comment)
    
    # Recursively attach replies
    def attach_replies(comment):
        if comment.id in comments_by_parent:
            comment._replies = sorted(comments_by_parent[comment.id], key=lambda x: x.created_at)
            for reply in comment._replies:
                attach_replies(reply)
        else:
            comment._replies = []
    
    for root_comment in root_comments:
        attach_replies(root_comment)
    
    return CommentSerializer(root_comments, many=True).data
```

**Result**: 1 SQL query for all comments + 1 for likes (via prefetch) = O(1) queries regardless of comment count.

## 2. The Math: 24-Hour Leaderboard Calculation

The leaderboard must calculate karma earned **only in the last 24 hours**, dynamically from transaction history.

### Database Model

```python
class KarmaTransaction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    amount = models.IntegerField()  # +5 for post like, +1 for comment like
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    created_at = models.DateTimeField(auto_now_add=True)
```

**Key Design Decision**: We store transactions, not a cached "daily_karma" field. This ensures accuracy and allows for historical analysis.

### The Query

```python
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum

cutoff_time = timezone.now() - timedelta(hours=24)

leaderboard_data = KarmaTransaction.objects.filter(
    created_at__gte=cutoff_time
).values('user').annotate(
    total_karma=Sum('amount')
).order_by('-total_karma')[:5]
```

**SQL Generated** (approximate):
```sql
SELECT 
    user_id,
    SUM(amount) AS total_karma
FROM feed_karmatransaction
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY user_id
ORDER BY total_karma DESC
LIMIT 5;
```

**Performance**: With an index on `(user, -created_at)`, this query is efficient even with millions of transactions.

### Why Not Cache Daily Karma?

The requirement explicitly states: *"Do not store 'Daily Karma' in a simple integer field on the User model."*

**Reasons**:
1. **Accuracy**: Transactions are the source of truth. Cached values can drift.
2. **Auditability**: We can verify and debug karma calculations.
3. **Flexibility**: Easy to change the time window (e.g., "last 7 days").
4. **Concurrency**: No need to update cached values on every like/unlike.

## 3. Concurrency: Preventing Double-Likes

### The Problem

Race condition: Two simultaneous requests to like the same post could both succeed, creating duplicate likes and inflating karma.

### Solution 1: Database-Level Constraint

```python
class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    
    class Meta:
        unique_together = ['user', 'content_type', 'object_id']
```

This ensures database-level uniqueness.

### Solution 2: Atomic Transaction with Lock

```python
with transaction.atomic():
    like, created = Like.objects.select_for_update().get_or_create(
        user=user,
        content_type=content_type,
        object_id=post.id,
        defaults={}
    )
```

**How it works**:
- `select_for_update()` locks the row (or potential row) during the transaction
- `get_or_create()` is atomic - either gets existing like or creates new one
- If two requests arrive simultaneously, one waits for the other to complete
- The second request will see the like already exists (`created=False`)

**Result**: Even under high concurrency, each user can only like a post/comment once.

## 4. The AI Audit: A Bug Caught and Fixed

### The Bug

Initially, the unlike logic was:

```python
if not created:
    like.delete()
    # Remove karma transaction
    KarmaTransaction.objects.filter(
        user=post.author,
        content_type=content_type,
        object_id=post.id,
        created_at__gte=timezone.now() - timedelta(hours=24)
    ).delete()  # ❌ Deletes ALL transactions in last 24h!
```

**Problem**: If User A likes a post, then User B likes it, then User A unlikes it, this code would delete **both** karma transactions (User A's and User B's), incorrectly removing User B's karma.

### The Fix

```python
if not created:
    like.delete()
    # Remove only the most recent matching transaction
    karma_tx = KarmaTransaction.objects.filter(
        user=post.author,
        content_type=content_type,
        object_id=post.id,
        amount=5  # Post like = 5 karma
    ).order_by('-created_at').first()
    if karma_tx:
        karma_tx.delete()
```

**Improvement**: 
- Filters by `amount=5` to match post likes specifically
- Uses `.first()` to delete only one transaction
- Orders by `-created_at` to get the most recent (which should correspond to this like)

**Better Solution** (for production): Add a foreign key from `KarmaTransaction` to `Like` to create an explicit relationship. This would require a migration but provides perfect tracking.

### Why AI Missed This

AI tools often generate code that works for the "happy path" but miss edge cases involving:
- Multiple users interacting with the same content
- State changes over time (like → unlike → like again)
- Concurrency scenarios

**Lesson**: Always review AI-generated code for edge cases, especially around state management and concurrent operations.

## Additional Optimizations

### 1. Indexes

```python
class KarmaTransaction(models.Model):
    class Meta:
        indexes = [
            models.Index(fields=['user', '-created_at']),  # For leaderboard queries
            models.Index(fields=['-created_at']),  # For time-based filtering
        ]
```

### 2. Select Related for Author

```python
queryset = Post.objects.select_related('author').prefetch_related(...)
```

Reduces queries when serializing post authors.

### 3. Generic Foreign Keys

Using Django's `ContentType` framework allows `Like` and `KarmaTransaction` to work with both `Post` and `Comment` models without code duplication.

## Summary

- **Nested Comments**: O(1) queries via prefetch + in-memory tree building
- **Leaderboard**: Dynamic calculation from transactions with indexed queries
- **Concurrency**: Database constraints + atomic transactions with row locking
- **AI Lessons**: Always validate edge cases, especially around state and concurrency
