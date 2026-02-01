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
        # Get CSRF token for the response
        csrf_token = get_token(request)
        response = Response({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username
            }
        })
        # Set CSRF token in response header
        response['X-CSRFToken'] = csrf_token
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
    
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email', '')
    
    if not username or not password:
        return Response(
            {'error': 'Username and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if user already exists
    if User.objects.filter(username=username).exists():
        return Response(
            {'error': 'Username already exists'},
            status=status.HTTP_400_BAD_REQUEST
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
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
