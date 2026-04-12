"""
Vues spécifiques pour l'administration
"""
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone
from datetime import timedelta
from rest_framework import serializers

from accounts.permissions import IsAdministrator
from accounts.models import User
from .models import CategorieService, Prestation, Demande, TransactionService
from .serializers import (
    PrestationSerializer, 
    DemandeSerializer,
    CategorieServiceSerializer
)

# Serializer pour les transactions
class TransactionServiceSerializer(serializers.ModelSerializer):
    """Serializer pour les transactions"""
    prestataire_nom = serializers.CharField(source='prestataire.username', read_only=True)
    fournisseur_nom = serializers.CharField(source='fournisseur.username', read_only=True)
    prestation_intitule = serializers.CharField(source='prestation.intitule', read_only=True)
    demande_intitule = serializers.CharField(source='demande.intitule', read_only=True)
    
    class Meta:
        model = TransactionService
        fields = [
            'id', 'prestation', 'demande', 'prestataire', 'fournisseur',
            'prestataire_nom', 'fournisseur_nom', 'prestation_intitule', 'demande_intitule',
            'prix_final', 'statut', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

# Serializer pour les utilisateurs (créé ici pour éviter les imports circulaires)
class UserSerializer(serializers.ModelSerializer):
    """Serializer pour les utilisateurs"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'type_utilisateur', 'is_active', 'date_joined', 'last_login',
            'telephone', 'raison_sociale'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

class AdminUserListView(generics.ListAPIView):
    """Vue pour lister tous les utilisateurs (admin uniquement)"""
    permission_classes = [permissions.IsAuthenticated, IsAdministrator]
    serializer_class = UserSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['type_utilisateur', 'is_active']
    search_fields = ['first_name', 'last_name', 'email', 'raison_sociale']
    ordering_fields = ['date_joined', 'last_login']
    ordering = ['-date_joined']
    
    def get_queryset(self):
        return User.objects.all().select_related('profile_prestataire', 'profile_fournisseur')

class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Vue pour gérer un utilisateur spécifique (admin uniquement)"""
    permission_classes = [permissions.IsAuthenticated, IsAdministrator]
    serializer_class = UserSerializer
    queryset = User.objects.all()
    
    def perform_destroy(self, instance):
        # Soft delete : désactiver au lieu de supprimer
        instance.is_active = False
        instance.save()

class AdminPrestationListView(generics.ListAPIView):
    """Vue pour lister toutes les prestations (admin uniquement)"""
    permission_classes = [permissions.IsAuthenticated, IsAdministrator]
    serializer_class = PrestationSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['categorie', 'statut', 'type_prestation']
    search_fields = ['intitule', 'description', 'type_prestation']
    ordering_fields = ['created_at', 'updated_at', 'tarif_min']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Prestation.objects.select_related('prestataire', 'categorie')

class AdminDemandeListView(generics.ListAPIView):
    """Vue pour lister toutes les demandes (admin uniquement)"""
    permission_classes = [permissions.IsAuthenticated, IsAdministrator]
    serializer_class = DemandeSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['categorie', 'statut', 'urgence', 'type_service']
    search_fields = ['intitule', 'description', 'lieu_intervention']
    ordering_fields = ['created_at', 'updated_at', 'date_limite']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Demande.objects.select_related('fournisseur', 'categorie')

class AdminTransactionListView(generics.ListAPIView):
    """Vue pour lister toutes les transactions (admin uniquement)"""
    permission_classes = [permissions.IsAuthenticated, IsAdministrator]
    serializer_class = TransactionServiceSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['statut']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return TransactionService.objects.select_related(
            'prestation', 'demande', 'prestataire', 'fournisseur'
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsAdministrator])
def admin_statistics(request):
    """
    Statistiques détaillées pour l'administration
    """
    try:
        # Statistiques utilisateurs
        user_stats = User.objects.aggregate(
            total_users=Count('id'),
            active_users=Count('id', filter=Q(is_active=True)),
            prestataires=Count('id', filter=Q(type_utilisateur='prestataire')),
            fournisseurs=Count('id', filter=Q(type_utilisateur='fournisseur')),
            administrateurs=Count('id', filter=Q(type_utilisateur='administrateur'))
        )
        
        # Statistiques prestations
        prestation_stats = Prestation.objects.aggregate(
            total_prestations=Count('id'),
            active_prestations=Count('id', filter=Q(statut='active')),
            avg_tarif=Avg('tarif_min'),
            total_revenu_potentiel=Sum('tarif_max')
        )
        
        # Statistiques demandes
        demande_stats = Demande.objects.aggregate(
            total_demandes=Count('id'),
            ouvertes_demandes=Count('id', filter=Q(statut='ouverte')),
            avg_budget=Avg('budget')
        )
        
        # Statistiques transactions
        transaction_stats = TransactionService.objects.aggregate(
            total_transactions=Count('id'),
            terminees_transactions=Count('id', filter=Q(statut='terminee')),
            total_revenu=Sum('prix_final')
        )
        
        # Statistiques catégories
        categorie_stats = CategorieService.objects.aggregate(
            total_categories=Count('id'),
            active_categories=Count('id', filter=Q(est_active=True))
        )
        
        # Activité récente (30 derniers jours)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        recent_activity = {
            'new_users': User.objects.filter(date_joined__gte=thirty_days_ago).count(),
            'new_prestations': Prestation.objects.filter(created_at__gte=thirty_days_ago).count(),
            'new_demandes': Demande.objects.filter(created_at__gte=thirty_days_ago).count(),
            'new_transactions': TransactionService.objects.filter(created_at__gte=thirty_days_ago).count()
        }
        
        # Revenus mensuels (6 derniers mois)
        monthly_revenue = []
        for i in range(6):
            month_start = timezone.now() - timedelta(days=30*i)
            month_end = month_start + timedelta(days=30)
            
            revenue = TransactionService.objects.filter(
                created_at__gte=month_start,
                created_at__lt=month_end,
                statut='terminee'
            ).aggregate(total=Sum('prix_final'))['total'] or 0
            
            monthly_revenue.append({
                'month': month_start.strftime('%Y-%m'),
                'revenue': revenue
            })
        
        # Top prestataires (par nombre de prestations)
        top_prestataires = User.objects.filter(
            type_utilisateur='prestataire'
        ).annotate(
            prestation_count=Count('prestations')
        ).order_by('-prestation_count')[:5]
        
        # Top catégories (par nombre de prestations)
        top_categories = CategorieService.objects.annotate(
            prestation_count=Count('prestations')
        ).order_by('-prestation_count')[:5]
        
        return Response({
            'users': user_stats,
            'prestations': prestation_stats,
            'demandes': demande_stats,
            'transactions': transaction_stats,
            'categories': categorie_stats,
            'recent_activity': recent_activity,
            'monthly_revenue': monthly_revenue,
            'top_prestataires': [
                {
                    'id': p.id,
                    'name': f"{p.first_name} {p.last_name}",
                    'raison_sociale': getattr(p.profile_prestataire, 'raison_sociale', ''),
                    'prestation_count': p.prestation_count
                }
                for p in top_prestataires
            ],
            'top_categories': [
                {
                    'id': c.id,
                    'nom': c.nom,
                    'prestation_count': c.prestation_count
                }
                for c in top_categories
            ]
        })
        
    except Exception as e:
        return Response(
            {'error': str(e), 'message': 'Erreur lors du calcul des statistiques'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsAdministrator])
def toggle_user_status(request, user_id):
    """
    Activer/désactiver un utilisateur
    """
    try:
        user = User.objects.get(id=user_id)
        user.is_active = not user.is_active
        user.save()
        
        return Response({
            'message': f'Utilisateur {"activé" if user.is_active else "désactivé"} avec succès',
            'is_active': user.is_active
        })
    except User.DoesNotExist:
        return Response(
            {'error': 'Utilisateur non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsAdministrator])
def bulk_delete_services(request):
    """
    Suppression en masse de services (prestations ou demandes)
    """
    try:
        service_type = request.data.get('type')  # 'prestation' ou 'demande'
        service_ids = request.data.get('ids', [])
        
        if not service_ids or service_type not in ['prestation', 'demande']:
            return Response(
                {'error': 'Paramètres invalides'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if service_type == 'prestation':
            deleted_count = Prestation.objects.filter(id__in=service_ids).delete()[0]
        else:
            deleted_count = Demande.objects.filter(id__in=service_ids).delete()[0]
        
        return Response({
            'message': f'{deleted_count} {service_type}s supprimées avec succès',
            'deleted_count': deleted_count
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsAdministrator])
def export_data(request):
    """
    Exporter les données au format CSV/JSON
    """
    try:
        export_type = request.GET.get('type', 'users')  # users, prestations, demandes, transactions
        format_type = request.GET.get('format', 'json')  # json, csv
        
        if export_type == 'users':
            data = User.objects.all().values(
                'id', 'first_name', 'last_name', 'email', 'type_utilisateur',
                'is_active', 'date_joined', 'last_login'
            )
        elif export_type == 'prestations':
            data = Prestation.objects.select_related('prestataire', 'categorie').all()
        elif export_type == 'demandes':
            data = Demande.objects.select_related('fournisseur', 'categorie').all()
        elif export_type == 'transactions':
            data = TransactionService.objects.select_related(
                'prestation', 'demande', 'prestataire', 'fournisseur'
            ).all()
        else:
            return Response(
                {'error': 'Type d\'export non valide'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Pour l'instant, retourner en JSON
        # TODO: Implémenter l'export CSV
        
        return Response({'data': list(data)})
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
