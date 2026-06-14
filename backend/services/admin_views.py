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
from accounts.models import User, ProfileClient
from .models import CategorieService, SousCategorieService, Prestation, Besoin, TransactionService, Message
from .serializers import (
    PrestationSerializer,
    BesoinSerializer,
    CategorieServiceSerializer,
    SousCategorieServiceSerializer,
    MessageSerializer,
)

# Serializer pour les transactions
class TransactionServiceSerializer(serializers.ModelSerializer):
    """Serializer pour les transactions"""
    fournisseur_nom = serializers.CharField(source='fournisseur.username', read_only=True)
    client_nom = serializers.CharField(source='client.username', read_only=True)
    prestation_intitule = serializers.CharField(source='prestation.intitule', read_only=True)
    besoin_intitule = serializers.CharField(source='besoin.intitule', read_only=True)
    
    class Meta:
        model = TransactionService
        fields = [
            'id', 'prestation', 'besoin', 'fournisseur', 'client',
            'fournisseur_nom', 'client_nom', 'prestation_intitule', 'besoin_intitule',
            'prix_final', 'statut',
            'devis_montant_propose', 'devis_description', 'devis_statut',
            'devis_date_proposition', 'devis_date_reponse_client', 'devis_propose_par',
            'travail_fournisseur_termine', 'travail_fournisseur_date',
            'verification_client_effectuee', 'verification_client_validee', 'verification_client_date',
            'demande_validation_admin', 'demande_validation_admin_date',
            'validation_admin_statut', 'validation_admin_date',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

# Serializer pour les utilisateurs (créé ici pour éviter les imports circulaires)
class UserSerializer(serializers.ModelSerializer):
    """Serializer pour les utilisateurs (admin)."""
    full_name = serializers.SerializerMethodField()
    raison_sociale = serializers.SerializerMethodField()
    client_abonnement_type = serializers.ChoiceField(
        choices=ProfileClient.ABONNEMENT_CHOICES,
        required=False,
        allow_null=True,
    )
    client_abonnement_actif = serializers.BooleanField(required=False)
    client_abonnement_debut = serializers.DateField(required=False, allow_null=True)
    client_abonnement_fin = serializers.DateField(required=False, allow_null=True)
    client_matching_self_service = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'type_utilisateur', 'is_active', 'date_joined', 'last_login',
            'telephone', 'raison_sociale',
            'client_abonnement_type', 'client_abonnement_actif',
            'client_abonnement_debut', 'client_abonnement_fin',
            'client_matching_self_service',
        ]
        read_only_fields = ['id', 'date_joined', 'last_login', 'client_matching_self_service']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    def _client_profile(self, obj):
        return getattr(obj, 'profile_client', None)

    def get_raison_sociale(self, obj):
        if obj.type_utilisateur == 'client':
            profile = self._client_profile(obj)
            return profile.raison_sociale if profile else ''
        if obj.type_utilisateur == 'fournisseur':
            profile = getattr(obj, 'profile_fournisseur', None)
            return profile.raison_sociale if profile else ''
        return ''

    def get_client_matching_self_service(self, obj):
        if obj.type_utilisateur != 'client':
            return None
        profile = self._client_profile(obj)
        return profile.can_self_launch_matching() if profile else False

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.type_utilisateur == 'client':
            profile = self._client_profile(instance)
            if profile:
                data['client_abonnement_type'] = profile.abonnement_type
                data['client_abonnement_actif'] = profile.abonnement_actif
                data['client_abonnement_debut'] = profile.abonnement_debut
                data['client_abonnement_fin'] = profile.abonnement_fin
        else:
            data.pop('client_abonnement_type', None)
            data.pop('client_abonnement_actif', None)
            data.pop('client_abonnement_debut', None)
            data.pop('client_abonnement_fin', None)
        return data

    def update(self, instance, validated_data):
        client_premium_data = {}
        for field in (
            'client_abonnement_type',
            'client_abonnement_actif',
            'client_abonnement_debut',
            'client_abonnement_fin',
        ):
            if field in validated_data:
                client_premium_data[field.replace('client_', '')] = validated_data.pop(field)

        instance = super().update(instance, validated_data)

        if client_premium_data and instance.type_utilisateur == 'client':
            profile, _ = ProfileClient.objects.get_or_create(user=instance)
            for attr, value in client_premium_data.items():
                setattr(profile, attr, value)
            profile.save()

        return instance

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
        return User.objects.all().select_related('profile_client', 'profile_fournisseur')

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
        return Prestation.objects.select_related('fournisseur', 'categorie')

class AdminCategoryListCreateView(generics.ListCreateAPIView):
    """Lister et créer des catégories (admin uniquement)."""
    permission_classes = [permissions.IsAuthenticated, IsAdministrator]
    serializer_class = CategorieServiceSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['est_active']
    ordering_fields = ['nom', 'created_at']
    ordering = ['nom']

    def get_queryset(self):
        return CategorieService.objects.all().prefetch_related('sous_categories')


class AdminCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Détail / modification / suppression d'une catégorie (admin uniquement)."""
    permission_classes = [permissions.IsAuthenticated, IsAdministrator]
    serializer_class = CategorieServiceSerializer
    queryset = CategorieService.objects.all().prefetch_related('sous_categories')


class AdminSubCategoryListCreateView(generics.ListCreateAPIView):
    """Lister et créer des sous-catégories (admin uniquement)."""
    permission_classes = [permissions.IsAuthenticated, IsAdministrator]
    serializer_class = SousCategorieServiceSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['categorie', 'est_active']
    ordering_fields = ['nom', 'created_at']
    ordering = ['categorie__nom', 'nom']

    def get_queryset(self):
        return SousCategorieService.objects.select_related('categorie').all()


class AdminSubCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Détail / modification / suppression d'une sous-catégorie (admin uniquement)."""
    permission_classes = [permissions.IsAuthenticated, IsAdministrator]
    serializer_class = SousCategorieServiceSerializer
    queryset = SousCategorieService.objects.select_related('categorie').all()

class AdminBesoinListView(generics.ListAPIView):
    """Vue pour lister tous les besoins (admin uniquement)"""
    permission_classes = [permissions.IsAuthenticated, IsAdministrator]
    serializer_class = BesoinSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['categorie', 'statut', 'urgence', 'type_service']
    search_fields = ['intitule', 'description', 'lieu_intervention']
    ordering_fields = ['created_at', 'updated_at', 'date_limite']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Besoin.objects.select_related('client', 'categorie')

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
            'prestation', 'besoin', 'fournisseur', 'client'
        )


class AdminMessageListView(generics.ListAPIView):
    """Liste tous les messages (admin uniquement)."""

    permission_classes = [permissions.IsAuthenticated, IsAdministrator]
    serializer_class = MessageSerializer
    ordering = ['-created_at']

    def get_queryset(self):
        return Message.objects.select_related('expediteur', 'destinataire', 'transaction').all()


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
            fournisseurs=Count('id', filter=Q(type_utilisateur='fournisseur')),
            clients=Count('id', filter=Q(type_utilisateur='client')),
            administrateurs=Count('id', filter=Q(type_utilisateur='administrateur'))
        )
        
        # Statistiques prestations
        prestation_stats = Prestation.objects.aggregate(
            total_prestations=Count('id'),
            active_prestations=Count('id', filter=Q(statut='active')),
            avg_tarif=Avg('tarif_min'),
            total_revenu_potentiel=Sum('tarif_max')
        )
        
        # Statistiques besoins
        besoin_stats = Besoin.objects.aggregate(
            total_besoins=Count('id'),
            ouvertes_besoins=Count('id', filter=Q(statut='ouverte')),
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
            'new_besoins': Besoin.objects.filter(created_at__gte=thirty_days_ago).count(),
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
        
        # Top fournisseurs (par nombre de prestations)
        top_fournisseurs = (
            User.objects.filter(type_utilisateur='fournisseur')
            .select_related('profile_fournisseur')
            .annotate(prestation_count=Count('prestations'))
            .order_by('-prestation_count')[:5]
        )
        
        # Top catégories (par nombre de prestations)
        top_categories = CategorieService.objects.annotate(
            prestation_count=Count('prestations')
        ).order_by('-prestation_count')[:5]
        
        return Response({
            'users': user_stats,
            'prestations': prestation_stats,
            'besoins': besoin_stats,
            'transactions': transaction_stats,
            'categories': categorie_stats,
            'recent_activity': recent_activity,
            'monthly_revenue': monthly_revenue,
            'top_fournisseurs': [
                {
                    'id': p.id,
                    'name': f"{p.first_name} {p.last_name}".strip() or p.username,
                    'raison_sociale': (
                        p.profile_fournisseur.raison_sociale
                        if hasattr(p, 'profile_fournisseur') and p.profile_fournisseur
                        else ''
                    ),
                    'prestation_count': p.prestation_count,
                }
                for p in top_fournisseurs
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
    Suppression en masse de services (prestations ou besoins)
    """
    try:
        service_type = request.data.get('type')  # 'prestation' ou 'besoin'
        service_ids = request.data.get('ids', [])
        
        if not service_ids or service_type not in ['prestation', 'besoin']:
            return Response(
                {'error': 'Paramètres invalides'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if service_type == 'prestation':
            deleted_count = Prestation.objects.filter(id__in=service_ids).delete()[0]
        else:
            deleted_count = Besoin.objects.filter(id__in=service_ids).delete()[0]
        
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
        export_type = request.GET.get('type', 'users')  # users, prestations, besoins, transactions
        format_type = request.GET.get('format', 'json')  # json, csv
        
        if export_type == 'users':
            data = User.objects.all().values(
                'id', 'first_name', 'last_name', 'email', 'type_utilisateur',
                'is_active', 'date_joined', 'last_login'
            )
        elif export_type == 'prestations':
            data = Prestation.objects.select_related('fournisseur', 'categorie').all()
        elif export_type == 'besoins':
            data = Besoin.objects.select_related('client', 'categorie').all()
        elif export_type == 'transactions':
            data = TransactionService.objects.select_related(
                'prestation', 'besoin', 'fournisseur', 'client'
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
