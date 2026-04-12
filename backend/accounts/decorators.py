"""
Décorateurs pour les permissions spécifiques aux types d'utilisateurs
"""
from functools import wraps
from django.http import JsonResponse
from django.core.exceptions import PermissionDenied
from rest_framework import status
from .permissions import IsServiceProvider, IsClientProvider

def provider_required(view_func):
    """
    Décorateur pour restreindre l'accès aux fournisseurs de services
    """
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        permission = IsServiceProvider()
        if not permission.has_permission(request, view_func):
            return JsonResponse({
                'error': 'Accès refusé',
                'message': 'Cette fonctionnalité est réservée aux fournisseurs de services',
                'required_user_type': 'service_provider'
            }, status=status.HTTP_403_FORBIDDEN)
        return view_func(request, *args, **kwargs)
    return _wrapped_view

def client_provider_required(view_func):
    """
    Décorateur pour restreindre l'accès aux fournisseurs clients
    """
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        permission = IsClientProvider()
        if not permission.has_permission(request, view_func):
            return JsonResponse({
                'error': 'Accès refusé',
                'message': 'Cette fonctionnalité est réservée aux clients',
                'required_user_type': 'client'
            }, status=status.HTTP_403_FORBIDDEN)
        return view_func(request, *args, **kwargs)
    return _wrapped_view

def user_type_required(user_types):
    """
    Décorateur générique pour restreindre l'accès à certains types d'utilisateurs
    """
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if not request.user or not request.user.is_authenticated:
                return JsonResponse({
                    'error': 'Authentification requise',
                    'message': 'Vous devez être connecté pour accéder à cette ressource'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            if isinstance(user_types, str):
                user_types = [user_types]
            
            if request.user.user_type not in user_types:
                return JsonResponse({
                    'error': 'Accès refusé',
                    'message': f"Accès réservé aux types: {', '.join(user_types)}",
                    'current_user_type': request.user.user_type
                }, status=status.HTTP_403_FORBIDDEN)
            
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator
