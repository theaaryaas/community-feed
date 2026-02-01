from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt
from .serializers import UserSerializer


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Custom login endpoint for frontend"""
    from django.middleware.csrf import get_token
    from django.views.decorators.csrf import ensure_csrf_cookie
    
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response(
            {'error': 'Username and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        # Get CSRF token
        csrf_token = get_token(request)
        
        response = Response({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username
            },
            'csrf_token': csrf_token  # Also return in response body
        })
        
        # Set CSRF token in response header
        response['X-CSRFToken'] = csrf_token
        # Ensure CSRF cookie is set
        response.set_cookie(
            'csrftoken',
            csrf_token,
            max_age=60 * 60 * 24 * 7,  # 7 days
            httponly=False,  # Allow JavaScript to read
            samesite='None',
            secure=True  # HTTPS only
        )
        
        return response
    else:
        return Response(
            {'error': 'Invalid username or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Get current authenticated user"""
    return Response({
        'user': UserSerializer(request.user).data
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def check_auth(request):
    """Check if user is authenticated"""
    if request.user.is_authenticated:
        return Response({
            'authenticated': True,
            'user': UserSerializer(request.user).data
        })
    else:
        return Response({
            'authenticated': False
        })


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    """Logout endpoint for frontend"""
    logout(request)
    return Response({
        'success': True,
        'message': 'Logged out successfully'
    })


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def create_user_view(request):
    """Temporary endpoint to create user (for free tier without shell access)
    ⚠️ REMOVE THIS AFTER CREATING YOUR USER FOR SECURITY!"""
    from django.contrib.auth.models import User
    from django.db import connection
    import traceback
    
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email', '')
    
    if not username or not password:
        return Response(
            {'error': 'Username and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate password length
    if len(password) < 6:
        return Response(
            {'error': 'Password must be at least 6 characters long'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check database connection
    try:
        connection.ensure_connection()
    except Exception as db_error:
        return Response(
            {'error': f'Database connection failed: {str(db_error)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    # Check if user already exists
    try:
        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
    except Exception as e:
        return Response(
            {'error': f'Database error checking user: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    try:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            is_staff=True,  # Allow admin access
            is_superuser=True  # Superuser access
        )
        return Response({
            'success': True,
            'message': f'User {username} created successfully',
            'user': {
                'id': user.id,
                'username': user.username
            }
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        # Log full traceback for debugging
        error_trace = traceback.format_exc()
        print(f"Error creating user: {error_trace}")  # This will appear in Render logs
        
        # Return user-friendly error message
        error_msg = str(e)
        if 'UNIQUE constraint' in error_msg or 'duplicate key' in error_msg.lower():
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        elif 'no such table' in error_msg.lower() or 'relation' in error_msg.lower():
            return Response(
                {'error': 'Database tables not set up. Please run migrations.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        else:
            return Response(
                {'error': f'Failed to create user: {error_msg}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
