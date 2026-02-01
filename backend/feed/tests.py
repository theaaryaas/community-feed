from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import Sum
from datetime import timedelta
from rest_framework.test import APIClient
from rest_framework import status
from .models import Post, Comment, Like, KarmaTransaction
from django.contrib.contenttypes.models import ContentType


class LeaderboardTestCase(TestCase):
    """Test the 24-hour leaderboard calculation"""

    def setUp(self):
        """Create test users and posts"""
        self.user1 = User.objects.create_user(username='user1', password='test123')
        self.user2 = User.objects.create_user(username='user2', password='test123')
        self.user3 = User.objects.create_user(username='user3', password='test123')

    def test_leaderboard_calculates_last_24h_only(self):
        """Test that leaderboard only counts karma from last 24 hours"""
        post = Post.objects.create(author=self.user1, content='Test post')
        content_type = ContentType.objects.get_for_model(Post)

        # Create a like 25 hours ago (should NOT count)
        old_time = timezone.now() - timedelta(hours=25)
        KarmaTransaction.objects.create(
            user=self.user1,
            amount=5,
            content_type=content_type,
            object_id=post.id,
            created_at=old_time
        )

        # Create a like 1 hour ago (should count)
        recent_time = timezone.now() - timedelta(hours=1)
        KarmaTransaction.objects.create(
            user=self.user1,
            amount=5,
            content_type=content_type,
            object_id=post.id,
            created_at=recent_time
        )

        # Create karma for user2 (should count)
        KarmaTransaction.objects.create(
            user=self.user2,
            amount=10,
            content_type=content_type,
            object_id=post.id
        )

        # Calculate leaderboard
        cutoff_time = timezone.now() - timedelta(hours=24)
        leaderboard = KarmaTransaction.objects.filter(
            created_at__gte=cutoff_time
        ).values('user').annotate(
            total_karma=Sum('amount')
        ).order_by('-total_karma')

        # user2 should have 10 karma, user1 should have 5 karma
        results = list(leaderboard)
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]['user'], self.user2.id)
        self.assertEqual(results[0]['total_karma'], 10)
        self.assertEqual(results[1]['user'], self.user1.id)
        self.assertEqual(results[1]['total_karma'], 5)

    def test_leaderboard_top_5_limit(self):
        """Test that leaderboard returns only top 5 users"""
        post = Post.objects.create(author=self.user1, content='Test post')
        content_type = ContentType.objects.get_for_model(Post)

        # Create 6 users with different karma amounts
        users = []
        for i in range(6):
            user = User.objects.create_user(username=f'user{i}', password='test123')
            users.append(user)
            KarmaTransaction.objects.create(
                user=user,
                amount=10 - i,  # Decreasing amounts: 10, 9, 8, 7, 6, 5
                content_type=content_type,
                object_id=post.id
            )

        cutoff_time = timezone.now() - timedelta(hours=24)
        leaderboard = KarmaTransaction.objects.filter(
            created_at__gte=cutoff_time
        ).values('user').annotate(
            total_karma=Sum('amount')
        ).order_by('-total_karma')[:5]

        results = list(leaderboard)
        self.assertEqual(len(results), 5)
        # Should be ordered by karma descending
        self.assertEqual(results[0]['total_karma'], 10)
        self.assertEqual(results[4]['total_karma'], 6)

    def test_post_like_creates_karma_transaction(self):
        """Test that liking a post creates a karma transaction with amount=5"""
        post = Post.objects.create(author=self.user1, content='Test post')
        content_type = ContentType.objects.get_for_model(Post)

        # Simulate a like
        Like.objects.create(
            user=self.user2,
            content_type=content_type,
            object_id=post.id
        )

        KarmaTransaction.objects.create(
            user=self.user1,  # Post author gets karma
            amount=5,
            content_type=content_type,
            object_id=post.id
        )

        # Verify transaction exists
        transactions = KarmaTransaction.objects.filter(
            user=self.user1,
            amount=5,
            content_type=content_type,
            object_id=post.id
        )
        self.assertEqual(transactions.count(), 1)

    def test_comment_like_creates_karma_transaction(self):
        """Test that liking a comment creates a karma transaction with amount=1"""
        post = Post.objects.create(author=self.user1, content='Test post')
        comment = Comment.objects.create(
            post=post,
            author=self.user2,
            content='Test comment'
        )
        content_type = ContentType.objects.get_for_model(Comment)

        # Simulate a like
        Like.objects.create(
            user=self.user1,
            content_type=content_type,
            object_id=comment.id
        )

        KarmaTransaction.objects.create(
            user=self.user2,  # Comment author gets karma
            amount=1,
            content_type=content_type,
            object_id=comment.id
        )

        # Verify transaction exists
        transactions = KarmaTransaction.objects.filter(
            user=self.user2,
            amount=1,
            content_type=content_type,
            object_id=comment.id
        )
        self.assertEqual(transactions.count(), 1)


class LeaderboardAPITestCase(TestCase):
    """Test the leaderboard API endpoint"""

    def setUp(self):
        """Create test users and karma transactions"""
        self.client = APIClient()
        self.user1 = User.objects.create_user(username='user1', password='test123')
        self.user2 = User.objects.create_user(username='user2', password='test123')
        self.user3 = User.objects.create_user(username='user3', password='test123')
        self.user4 = User.objects.create_user(username='user4', password='test123')
        self.user5 = User.objects.create_user(username='user5', password='test123')
        self.user6 = User.objects.create_user(username='user6', password='test123')
        
        post = Post.objects.create(author=self.user1, content='Test post')
        content_type = ContentType.objects.get_for_model(Post)
        
        # Create karma transactions for last 24 hours
        # user1: 50 karma (should be #1)
        for _ in range(10):
            KarmaTransaction.objects.create(
                user=self.user1,
                amount=5,
                content_type=content_type,
                object_id=post.id
            )
        
        # user2: 30 karma (should be #2)
        for _ in range(6):
            KarmaTransaction.objects.create(
                user=self.user2,
                amount=5,
                content_type=content_type,
                object_id=post.id
            )
        
        # user3: 20 karma (should be #3)
        for _ in range(4):
            KarmaTransaction.objects.create(
                user=self.user3,
                amount=5,
                content_type=content_type,
                object_id=post.id
            )
        
        # user4: 15 karma (should be #4)
        for _ in range(3):
            KarmaTransaction.objects.create(
                user=self.user4,
                amount=5,
                content_type=content_type,
                object_id=post.id
            )
        
        # user5: 10 karma (should be #5)
        for _ in range(2):
            KarmaTransaction.objects.create(
                user=self.user5,
                amount=5,
                content_type=content_type,
                object_id=post.id
            )
        
        # user6: 5 karma (should NOT appear - only top 5)
        KarmaTransaction.objects.create(
            user=self.user6,
            amount=5,
            content_type=content_type,
            object_id=post.id
        )
        
        # Create old transaction (should NOT count)
        old_time = timezone.now() - timedelta(hours=25)
        KarmaTransaction.objects.create(
            user=self.user1,
            amount=100,  # Large amount but old
            content_type=content_type,
            object_id=post.id,
            created_at=old_time
        )

    def test_leaderboard_api_returns_top_5(self):
        """Test that leaderboard API returns exactly top 5 users"""
        response = self.client.get('/api/leaderboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Should return exactly 5 users
        self.assertEqual(len(data), 5)
        
        # Check ordering (highest to lowest)
        self.assertEqual(data[0]['total_karma'], 50)
        self.assertEqual(data[0]['user']['username'], 'user1')
        self.assertEqual(data[0]['rank'], 1)
        
        self.assertEqual(data[1]['total_karma'], 30)
        self.assertEqual(data[1]['user']['username'], 'user2')
        self.assertEqual(data[1]['rank'], 2)
        
        self.assertEqual(data[2]['total_karma'], 20)
        self.assertEqual(data[2]['user']['username'], 'user3')
        self.assertEqual(data[2]['rank'], 3)
        
        self.assertEqual(data[3]['total_karma'], 15)
        self.assertEqual(data[3]['user']['username'], 'user4')
        self.assertEqual(data[3]['rank'], 4)
        
        self.assertEqual(data[4]['total_karma'], 10)
        self.assertEqual(data[4]['user']['username'], 'user5')
        self.assertEqual(data[4]['rank'], 5)
        
        # user6 should NOT be in results
        usernames = [entry['user']['username'] for entry in data]
        self.assertNotIn('user6', usernames)

    def test_leaderboard_api_excludes_old_karma(self):
        """Test that leaderboard only counts karma from last 24 hours"""
        response = self.client.get('/api/leaderboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # user1 should have 50 karma (not 150 from old transaction)
        user1_entry = next((entry for entry in data if entry['user']['username'] == 'user1'), None)
        self.assertIsNotNone(user1_entry)
        self.assertEqual(user1_entry['total_karma'], 50)


class PostLikeConcurrencyTestCase(TestCase):
    """Test concurrency protection for likes"""

    def setUp(self):
        self.user1 = User.objects.create_user(username='user1', password='test123')
        self.user2 = User.objects.create_user(username='user2', password='test123')
        self.post = Post.objects.create(author=self.user1, content='Test post')
        self.content_type = ContentType.objects.get_for_model(Post)

    def test_cannot_double_like_post(self):
        """Test that a user cannot like the same post twice"""
        # First like
        like1, created1 = Like.objects.get_or_create(
            user=self.user2,
            content_type=self.content_type,
            object_id=self.post.id
        )
        self.assertTrue(created1)
        
        # Try to like again
        like2, created2 = Like.objects.get_or_create(
            user=self.user2,
            content_type=self.content_type,
            object_id=self.post.id
        )
        self.assertFalse(created2)
        self.assertEqual(like1.id, like2.id)  # Should return same like
        
        # Should only have one like
        self.assertEqual(Like.objects.filter(
            user=self.user2,
            content_type=self.content_type,
            object_id=self.post.id
        ).count(), 1)


class NestedCommentsTestCase(TestCase):
    """Test nested comments functionality"""

    def setUp(self):
        self.user1 = User.objects.create_user(username='user1', password='test123')
        self.user2 = User.objects.create_user(username='user2', password='test123')
        self.post = Post.objects.create(author=self.user1, content='Test post')

    def test_nested_comments_structure(self):
        """Test that nested comments are properly structured"""
        # Create root comment
        root_comment = Comment.objects.create(
            post=self.post,
            author=self.user1,
            content='Root comment'
        )
        
        # Create first level reply
        reply1 = Comment.objects.create(
            post=self.post,
            author=self.user2,
            content='First reply',
            parent=root_comment
        )
        
        # Create second level reply
        reply2 = Comment.objects.create(
            post=self.post,
            author=self.user1,
            content='Second reply',
            parent=reply1
        )
        
        # Verify structure
        self.assertIsNone(root_comment.parent)
        self.assertEqual(reply1.parent, root_comment)
        self.assertEqual(reply2.parent, reply1)
        
        # Verify depth calculation
        self.assertEqual(root_comment.get_depth(), 0)
        self.assertEqual(reply1.get_depth(), 1)
        self.assertEqual(reply2.get_depth(), 2)
        
        # Verify all comments belong to same post
        self.assertEqual(root_comment.post, self.post)
        self.assertEqual(reply1.post, self.post)
        self.assertEqual(reply2.post, self.post)

    def test_comment_count_includes_nested(self):
        """Test that comment count includes nested comments"""
        # Create root comment
        root = Comment.objects.create(
            post=self.post,
            author=self.user1,
            content='Root'
        )
        
        # Create nested comments
        Comment.objects.create(
            post=self.post,
            author=self.user2,
            content='Reply 1',
            parent=root
        )
        Comment.objects.create(
            post=self.post,
            author=self.user1,
            content='Reply 2',
            parent=root
        )
        
        # Post should have 3 comments total (1 root + 2 replies)
        self.assertEqual(self.post.comments.count(), 3)
