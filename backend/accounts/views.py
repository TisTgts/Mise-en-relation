from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from accounts.permissions import IsAdministrator
from accounts.throttling import (
    LoginRateThrottle,
    RegisterRateThrottle,
    TokenRefreshRateThrottle,
)
from .models import ProfileClient, ProfileFournisseur, DevicePushToken
from .password_reset import confirm_password_reset, request_password_reset
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    UserUpdateSerializer,
    ProfileFournisseurSerializer,
    ProfileClientSerializer,
    ProfileFournisseurUpdateSerializer,
    ProfileClientUpdateSerializer,
)

User = get_user_model()

class UserListView(generics.ListAPIView):
    """Vue pour lister tous les utilisateurs (admin uniquement)"""
    permission_classes = [permissions.IsAuthenticated, IsAdministrator]
    queryset = User.objects.all()
    serializer_class = UserProfileSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['type_utilisateur', 'is_active']
    search_fields = ['first_name', 'last_name', 'email', 'username']
    ordering_fields = ['date_joined', 'last_login']
    ordering = ['-date_joined']

class ProviderListView(generics.ListAPIView):
    """Vue pour lister tous les fournisseurs de services (offreurs)."""
    queryset = ProfileFournisseur.objects.select_related('user').all()
    serializer_class = ProfileFournisseurSerializer
    permission_classes = [permissions.AllowAny]

class ClientProviderListView(generics.ListAPIView):
    """Vue pour lister tous les clients (demandeurs de services)."""
    queryset = ProfileClient.objects.select_related('user').all()
    serializer_class = ProfileClientSerializer
    permission_classes = [permissions.AllowAny]

class RegisterView(generics.CreateAPIView):
    """Vue pour l'inscription des utilisateurs"""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [RegisterRateThrottle]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Générer les tokens JWT
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserProfileSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([LoginRateThrottle])
def login_view(request):
    """Vue pour la connexion des utilisateurs"""
    serializer = UserLoginSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    
    user = serializer.validated_data['user']
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'user': UserProfileSerializer(user).data,
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """Vue pour la déconnexion des utilisateurs"""
    try:
        refresh_token = request.data["refresh"]
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({'message': 'Déconnexion réussie'})
    except Exception as e:
        return Response(
            {'error': 'Token invalide'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

class ProfileView(generics.RetrieveUpdateAPIView):
    """Profil métier (client ou fournisseur) : lecture et mise à jour des champs du modèle lié."""
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        user = self.request.user
        if user.type_utilisateur == 'fournisseur':
            profile, _ = ProfileFournisseur.objects.get_or_create(user=user)
            return profile
        if user.type_utilisateur == 'client':
            profile, _ = ProfileClient.objects.get_or_create(user=user)
            return profile
        return user

    def get_serializer_class(self):
        user = self.request.user
        if self.request.method in ('PUT', 'PATCH'):
            if user.type_utilisateur == 'fournisseur':
                return ProfileFournisseurUpdateSerializer
            if user.type_utilisateur == 'client':
                return ProfileClientUpdateSerializer
            return UserUpdateSerializer
        if user.type_utilisateur == 'fournisseur':
            return ProfileFournisseurSerializer
        if user.type_utilisateur == 'client':
            return ProfileClientSerializer
        return UserProfileSerializer

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_profile_view(request):
    """Vue pour obtenir le profil utilisateur simple"""
    serializer = UserProfileSerializer(request.user)
    return Response(serializer.data)

class CurrentUserView(generics.RetrieveUpdateAPIView):
    """Utilisateur courant : lecture et mise à jour (nom, téléphone, photo)."""
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        user = self.request.user
        if user.type_utilisateur == 'client':
            ProfileClient.objects.get_or_create(user=user)
            return User.objects.select_related('profile_client').get(pk=user.pk)
        return user

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return UserUpdateSerializer
        return UserProfileSerializer


class ThrottledTokenRefreshView(TokenRefreshView):
    """Renouvellement JWT avec limitation de débit."""

    throttle_classes = [TokenRefreshRateThrottle]


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([LoginRateThrottle])
def password_reset_request(request):
    """Demande un code de réinitialisation (email)."""
    email = request.data.get('email', '')
    payload = request_password_reset(email)
    return Response(payload, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([LoginRateThrottle])
def password_reset_confirm(request):
    """Valide le code et définit le nouveau mot de passe."""
    ok, message = confirm_password_reset(
        request.data.get('email', ''),
        request.data.get('code', ''),
        request.data.get('password') or request.data.get('new_password', ''),
    )
    if not ok:
        return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)
    return Response({'message': message}, status=status.HTTP_200_OK)


@api_view(['POST', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def push_token_view(request):
    """Enregistre ou retire un token Expo Push pour l'appareil courant."""
    token = (request.data.get('token') or '').strip()
    if not token:
        return Response({'error': 'Token requis.'}, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'DELETE':
        DevicePushToken.objects.filter(user=request.user, token=token).delete()
        return Response({'message': 'Token retiré.'}, status=status.HTTP_200_OK)

    platform = (request.data.get('platform') or '')[:20]
    obj, _ = DevicePushToken.objects.update_or_create(
        token=token,
        defaults={'user': request.user, 'platform': platform},
    )
    return Response(
        {'id': obj.id, 'token': obj.token, 'platform': obj.platform},
        status=status.HTTP_200_OK,
    )
