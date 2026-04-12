from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from accounts.permissions import IsAdministrator
from .models import ProfilePrestataire, ProfileFournisseur
from .serializers import (
    UserRegistrationSerializer, 
    UserLoginSerializer,
    UserProfileSerializer,
    ProfilePrestataireSerializer,
    ProfileFournisseurSerializer
)

User = get_user_model()

class UserListView(generics.ListAPIView):
    """Vue pour lister tous les utilisateurs (admin uniquement)"""
    permission_classes = [permissions.IsAuthenticated, IsAdministrator]
    queryset = User.objects.all()
    serializer_class = UserProfileSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['type_utilisateur', 'is_active']
    search_fields = ['first_name', 'last_name', 'email', 'raison_sociale']
    ordering_fields = ['date_joined', 'last_login']
    ordering = ['-date_joined']

class ProviderListView(generics.ListAPIView):
    """Vue pour lister tous les prestataires de services"""
    queryset = ProfilePrestataire.objects.select_related('user').all()
    serializer_class = ProfilePrestataireSerializer
    permission_classes = [permissions.AllowAny]

class ClientProviderListView(generics.ListAPIView):
    """Vue pour lister tous les fournisseurs de services"""
    queryset = ProfileFournisseur.objects.select_related('user').all()
    serializer_class = ProfileFournisseurSerializer
    permission_classes = [permissions.AllowAny]

class RegisterView(generics.CreateAPIView):
    """Vue pour l'inscription des utilisateurs"""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
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
    """Vue pour afficher et mettre à jour le profil utilisateur"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def get_serializer_class(self):
        user = self.get_object()
        if user.type_utilisateur == 'prestataire':
            try:
                return ProfilePrestataireSerializer
            except ProfilePrestataire.DoesNotExist:
                ProfilePrestataire.objects.create(user=user)
                return ProfilePrestataireSerializer
        elif user.type_utilisateur == 'fournisseur':
            try:
                return ProfileFournisseurSerializer
            except ProfileFournisseur.DoesNotExist:
                ProfileFournisseur.objects.create(user=user)
                return ProfileFournisseurSerializer
        return UserProfileSerializer

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_profile_view(request):
    """Vue pour obtenir le profil utilisateur simple"""
    serializer = UserProfileSerializer(request.user)
    return Response(serializer.data)

class CurrentUserView(generics.RetrieveAPIView):
    """Vue pour obtenir l'utilisateur courant authentifié"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserProfileSerializer
    
    def get_object(self):
        return self.request.user
