"""
Permissions personnalisées pour la plateforme de services
"""
from rest_framework import permissions

class IsServiceProvider(permissions.BasePermission):
    """
    Permission pour les fournisseurs de services uniquement
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return request.user.type_utilisateur == 'prestataire'

class IsClientProvider(permissions.BasePermission):
    """
    Permission pour les fournisseurs clients uniquement
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return request.user.type_utilisateur == 'fournisseur'

class IsAdministrator(permissions.BasePermission):
    """
    Permission pour les administrateurs uniquement
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return request.user.type_utilisateur == 'administrateur'

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permission pour le propriétaire de la ressource ou lecture seule
    """
    
    def has_object_permission(self, request, view, obj):
        # Permettre l'accès en lecture à tout le monde
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Vérifier si l'utilisateur est le propriétaire
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'provider'):
            return obj.provider.user == request.user
        elif hasattr(obj, 'client'):
            return obj.client.user == request.user
        
        return False

class IsServiceProviderOrReadOnly(permissions.BasePermission):
    """
    Permission pour les fournisseurs de services ou lecture seule
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Permettre l'accès en lecture à tout le monde authentifié
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return request.user.type_utilisateur == 'prestataire'

class IsClientProviderOrReadOnly(permissions.BasePermission):
    """
    Permission pour les fournisseurs clients ou lecture seule
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Permettre l'accès en lecture à tout le monde authentifié
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return request.user.type_utilisateur == 'fournisseur'

def get_user_permissions(user):
    """
    Retourne les permissions spécifiques selon le type d'utilisateur
    """
    if not user or not user.is_authenticated:
        return []
    
    permissions = []
    
    if user.type_utilisateur == 'prestataire':
        permissions = [
            'can_create_offer',
            'can_manage_own_offers',
            'can_view_needs',
            'can_respond_to_needs',
            'can_manage_profile',
            'can_view_statistics',
        ]
    elif user.type_utilisateur == 'fournisseur':
        permissions = [
            'can_create_need',
            'can_manage_own_needs',
            'can_view_offers',
            'can_contact_providers',
            'can_manage_profile',
            'can_view_statistics',
        ]
    elif user.type_utilisateur == 'administrateur':
        permissions = [
            'can_manage_all_users',
            'can_manage_all_offers',
            'can_manage_all_needs',
            'can_view_all_statistics',
            'can_moderate_platform',
        ]
    
    return permissions

class DynamicPermission(permissions.BasePermission):
    """
    Permission dynamique basée sur les permissions de l'utilisateur
    """
    
    def __init__(self, permission_code):
        self.permission_code = permission_code
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        user_permissions = get_user_permissions(request.user)
        return self.permission_code in user_permissions
