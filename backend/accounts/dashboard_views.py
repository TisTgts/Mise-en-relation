"""
Vues spécifiques pour les dashboards selon le type d'utilisateur
"""
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Count, Avg, Q
from .models import ProfilePrestataire, ProfileFournisseur
from .permissions import IsServiceProvider, IsClientProvider
from .serializers import ProfilePrestataireSerializer, ProfileFournisseurSerializer
from services.models import Prestation, Demande

User = get_user_model()

class ProviderDashboardView(generics.RetrieveAPIView):
    """
    Vue pour le dashboard des fournisseurs de services
    """
    permission_classes = [permissions.IsAuthenticated, IsServiceProvider]
    
    def get_object(self):
        return self.request.user
    
    def retrieve(self, request, *args, **kwargs):
        user = self.request.user
        provider_profile = user.profile_prestataire
        
        # Statistiques du prestataire
        stats = {
            'total_offers': Prestation.objects.filter(prestataire=user).count(),
            'active_offers': Prestation.objects.filter(prestataire=user, statut='active').count(),
            'completed_services': provider_profile.prestations_effectuees,
            'average_rating': provider_profile.note,
            'total_transactions': TransactionService.objects.filter(prestataire=user).count(),
        }
        
        # Offres récentes
        recent_offers = Prestation.objects.filter(prestataire=user).order_by('-created_at')[:5]
        
        data = {
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'type_utilisateur': user.type_utilisateur,
                'profile': ProfilePrestataireSerializer(provider_profile).data
            },
            'statistics': stats,
            'recent_offers': [
                {
                    'id': offer.id,
                    'intitule': offer.intitule,
                    'type_prestation': offer.type_prestation,
                    'statut': offer.statut,
                    'created_at': offer.created_at
                } for offer in recent_offers
            ]
        }
        
        return Response(data)

class ClientProviderDashboardView(generics.RetrieveAPIView):
    """
    Vue pour le dashboard des fournisseurs clients
    """
    permission_classes = [permissions.IsAuthenticated, IsClientProvider]
    
    def get_object(self):
        return self.request.user
    
    def retrieve(self, request, *args, **kwargs):
        user = request.user
        client_profile = user.client_provider_profile
        
        # Statistiques du client provider
        stats = {
            'total_needs': ServiceNeed.objects.filter(client=user).count(),
            'active_needs': ServiceNeed.objects.filter(client=user, status='active').count(),
            'completed_needs': ServiceNeed.objects.filter(client=user, status='completed').count(),
            'average_monthly_requests': client_profile.average_monthly_requests,
            'total_spent': 2500000,  # Simulé en FCFA
            'new_messages': 5,
            'pending_contracts': 2
        }
        
        # Besoins récents
        recent_needs = ServiceNeed.objects.filter(
            client=user
        ).order_by('-created_at')[:5]
        
        # Offres correspondantes
        matching_offers = ServiceOffer.objects.filter(
            service_type__in=client_profile.preferred_service_areas
        ).order_by('-created_at')[:5]
        
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'user_type': user.user_type,
                'profile': ClientProviderProfileSerializer(client_profile).data
            },
            'statistics': stats,
            'recent_needs': [
                {
                    'id': need.id,
                    'title': need.title,
                    'status': need.status,
                    'budget': need.budget,
                    'urgency': need.urgency,
                    'created_at': need.created_at,
                    'responses': 12,  # Simulé
                    'views': 89   # Simulé
                }
                for need in recent_needs
            ],
            'matching_offers': [
                {
                    'id': offer.id,
                    'title': offer.title,
                    'provider': offer.provider.username,
                    'rating': offer.provider.provider_profile.rating,
                    'price': offer.price_range_min,
                    'created_at': offer.created_at
                }
                for offer in matching_offers
            ]
        })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_router(request):
    """
    Routeur qui redirige vers le bon dashboard selon le type d'utilisateur
    """
    user = request.user
    
    if user.user_type == 'service_provider':
        # Rediriger vers le dashboard fournisseur
        view = ProviderDashboardView()
        view.request = request
        view.format_kwarg = None
        return view.retrieve(request)
    
    elif user.user_type == 'client_provider':
        # Rediriger vers le dashboard client provider
        view = ClientProviderDashboardView()
        view.request = request
        view.format_kwarg = None
        return view.retrieve(request)
    
    else:
        return Response({
            'error': 'Type d\'utilisateur non reconnu',
            'message': 'Votre type d\'utilisateur ne permet pas d\'accéder à un dashboard'
        }, status=status.HTTP_403_FORBIDDEN)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_capabilities(request):
    """
    Retourne les capacités et permissions de l'utilisateur connecté
    """
    user = request.user
    
    capabilities = {
        'user_type': user.user_type,
        'can_create_offer': user.user_type == 'service_provider',
        'can_create_need': user.user_type == 'client_provider',
        'can_view_offers': True,  # Tout le monde peut voir
        'can_view_needs': True,   # Tout le monde peut voir
        'can_contact_providers': user.user_type == 'client_provider',
        'can_be_contacted': user.user_type == 'service_provider',
        'can_manage_profile': True,
        'dashboard_url': f'/dashboard/{user.user_type}/'
    }
    
    return Response(capabilities)
