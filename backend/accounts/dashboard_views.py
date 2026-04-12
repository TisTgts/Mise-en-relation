"""
Vues spécifiques pour les dashboards selon le type d'utilisateur
"""
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import ProfileFournisseur, ProfileClient
from .permissions import IsServiceProvider, IsClientProvider
from .serializers import ProfileFournisseurSerializer, ProfileClientSerializer
from services.models import Prestation, Demande, TransactionService

User = get_user_model()


class ProviderDashboardView(generics.RetrieveAPIView):
    """Dashboard pour les fournisseurs de services (offreurs)."""
    permission_classes = [permissions.IsAuthenticated, IsServiceProvider]

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        user = self.request.user
        provider_profile, _ = ProfileFournisseur.objects.get_or_create(user=user)

        stats = {
            'total_offers': Prestation.objects.filter(fournisseur=user).count(),
            'active_offers': Prestation.objects.filter(fournisseur=user, statut='active').count(),
            'completed_services': provider_profile.services_effectues,
            'average_rating': provider_profile.note_moyenne,
            'total_transactions': TransactionService.objects.filter(fournisseur=user).count(),
        }

        recent_offers = Prestation.objects.filter(fournisseur=user).order_by('-created_at')[:5]

        data = {
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'type_utilisateur': user.type_utilisateur,
                'profile': ProfileFournisseurSerializer(provider_profile).data,
            },
            'statistics': stats,
            'recent_offers': [
                {
                    'id': offer.id,
                    'intitule': offer.intitule,
                    'type_prestation': offer.type_prestation,
                    'statut': offer.statut,
                    'created_at': offer.created_at,
                }
                for offer in recent_offers
            ],
        }

        return Response(data)


class ClientDashboardView(generics.RetrieveAPIView):
    """Dashboard pour les clients (demandeurs de services)."""
    permission_classes = [permissions.IsAuthenticated, IsClientProvider]

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        user = request.user
        client_profile, _ = ProfileClient.objects.get_or_create(user=user)

        stats = {
            'total_needs': Demande.objects.filter(client=user).count(),
            'active_needs': Demande.objects.filter(client=user, statut='ouverte').count(),
            'completed_needs': Demande.objects.filter(client=user, statut='pourvue').count(),
            'total_transactions': TransactionService.objects.filter(client=user).count(),
        }

        recent_needs = Demande.objects.filter(client=user).order_by('-created_at')[:5]

        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'type_utilisateur': user.type_utilisateur,
                'profile': ProfileClientSerializer(client_profile).data,
            },
            'statistics': stats,
            'recent_needs': [
                {
                    'id': need.id,
                    'intitule': need.intitule,
                    'statut': need.statut,
                    'budget': need.budget,
                    'urgence': need.urgence,
                    'created_at': need.created_at,
                }
                for need in recent_needs
            ],
        })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_router(request):
    """Routeur : fournisseur (offreur) ou client (demandeur)."""
    user = request.user

    if user.type_utilisateur == 'fournisseur':
        view = ProviderDashboardView()
        view.request = request
        view.format_kwarg = None
        return view.retrieve(request)

    if user.type_utilisateur == 'client':
        view = ClientDashboardView()
        view.request = request
        view.format_kwarg = None
        return view.retrieve(request)

    return Response(
        {
            'error': "Type d'utilisateur non reconnu",
            'message': "Votre type d'utilisateur ne permet pas d'accéder à ce dashboard",
        },
        status=status.HTTP_403_FORBIDDEN,
    )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_capabilities(request):
    """Capacités selon le type d'utilisateur (terminologie actuelle)."""
    user = request.user
    t = user.type_utilisateur

    return Response({
        'user_type': t,
        'can_create_offer': t == 'fournisseur',
        'can_create_need': t == 'client',
        'can_view_offers': True,
        'can_view_needs': True,
        'can_contact_providers': t == 'client',
        'can_be_contacted': t == 'fournisseur',
        'can_manage_profile': True,
        'dashboard_url': f'/dashboard/{t}/',
    })
