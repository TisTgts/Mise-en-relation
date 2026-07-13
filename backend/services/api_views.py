from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q
from django.contrib.auth import get_user_model
from .models import CategorieService, Prestation, Besoin, TransactionService
from .serializers import CategorieServiceSerializer

User = get_user_model()

@api_view(['GET'])
@permission_classes([AllowAny])  # Permet l'accès sans authentification
def service_categories_public(request):
    """
    Vue API simple pour récupérer les catégories de services publiques
    Accessible avec ou sans authentification
    """
    try:
        categories = CategorieService.objects.filter(est_active=True)
        serializer = CategorieServiceSerializer(categories, many=True)
        return Response({
            'success': True,
            'count': categories.count(),
            'results': serializer.data
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e),
            'message': 'Erreur lors de la récupération des catégories'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_statistics(request):
    """
    Vue API pour récupérer les statistiques administrateur
    Accessible uniquement aux utilisateurs authentifiés de type administrateur
    """
    if not request.user.is_admin_type:
        return Response({
            'success': False,
            'error': 'Accès non autorisé',
            'message': 'Seuls les administrateurs peuvent accéder à ces statistiques'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Statistiques des utilisateurs
        total_users = User.objects.count()
        fournisseurs_count = User.objects.filter(type_utilisateur='fournisseur').count()
        clients_count = User.objects.filter(type_utilisateur='client').count()
        administrateurs_count = User.objects.filter(type_utilisateur='administrateur').count()
        
        # Statistiques des services
        total_categories = CategorieService.objects.count()
        active_categories = CategorieService.objects.filter(est_active=True).count()
        total_prestations = Prestation.objects.count()
        total_besoins = Besoin.objects.count()
        total_transactions = TransactionService.objects.count()
        
        # Statuts des prestations
        prestations_by_status = Prestation.objects.values('statut').annotate(count=Count('id'))
        besoins_by_status = Besoin.objects.values('statut').annotate(count=Count('id'))
        
        # Transactions par statut
        transactions_by_status = TransactionService.objects.values('statut').annotate(count=Count('id'))
        
        return Response({
            'success': True,
            'data': {
                'users': {
                    'total': total_users,
                    'fournisseurs': fournisseurs_count,
                    'clients': clients_count,
                    'administrateurs': administrateurs_count,
                },
                'services': {
                    'categories': {
                        'total': total_categories,
                        'active': active_categories
                    },
                    'prestations': {
                        'total': total_prestations,
                        'by_status': list(prestations_by_status)
                    },
                    'besoins': {
                        'total': total_besoins,
                        'by_status': list(besoins_by_status)
                    },
                    'transactions': {
                        'total': total_transactions,
                        'by_status': list(transactions_by_status)
                    }
                }
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e),
            'message': 'Erreur lors de la récupération des statistiques'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
