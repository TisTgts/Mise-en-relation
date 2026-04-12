from rest_framework import generics, permissions, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models
from accounts.permissions import IsServiceProvider, IsClientProvider
from .models import CategorieService, Prestation, Demande, TransactionService, Message
from .serializers import (
    CategorieServiceSerializer,
    PrestationSerializer, 
    PrestationCreateSerializer,
    PrestationUpdateSerializer,
    DemandeSerializer,
    DemandeCreateSerializer,
    DemandeUpdateSerializer,
    TransactionServiceSerializer,
    MessageSerializer
)

class ServiceCategoryListView(generics.ListAPIView):
    """Vue pour lister les catégories de services"""
    queryset = CategorieService.objects.filter(est_active=True)
    serializer_class = CategorieServiceSerializer
    permission_classes = [permissions.AllowAny]  # Permet l'accès avec ou sans authentification
    filter_backends = [filters.SearchFilter]
    search_fields = ['nom', 'description']
    
    def get_serializer_context(self):
        """Ajouter le contexte de requête pour le serializer"""
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

class ServiceOfferListCreateView(generics.ListCreateAPIView):
    """Vue pour lister et créer des offres de services"""
    permission_classes = [permissions.IsAuthenticated, IsServiceProvider]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['categorie', 'type_prestation', 'statut']
    search_fields = ['intitule', 'description', 'type_prestation']
    ordering_fields = ['created_at', 'tarif_min']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        if user.type_utilisateur == 'fournisseur':
            return Prestation.objects.filter(fournisseur=user)
        return Prestation.objects.filter(statut='active')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PrestationCreateSerializer
        return PrestationSerializer

class ServiceOfferDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Vue pour afficher, modifier et supprimer une offre de service"""
    permission_classes = [permissions.IsAuthenticated, IsServiceProvider]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return PrestationUpdateSerializer
        return PrestationSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.type_utilisateur == 'fournisseur':
            return Prestation.objects.filter(fournisseur=user)
        return Prestation.objects.filter(statut='active')
    
    def perform_destroy(self, instance):
        """Log de la suppression et vérifications supplémentaires"""
        user = self.request.user
        
        # Vérifier que l'utilisateur est bien le propriétaire
        if instance.fournisseur != user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Vous n'êtes pas le propriétaire de cette prestation")
        
        # Log de la suppression
        print(f"Suppression de la prestation {instance.id} par l'utilisateur {user.username}")
        
        # Supprimer l'instance
        instance.delete()

class ServiceNeedListCreateView(generics.ListCreateAPIView):
    """Vue pour lister et créer des besoins de services"""
    permission_classes = [permissions.IsAuthenticated, IsClientProvider]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['categorie', 'type_service', 'urgence', 'statut']
    search_fields = ['intitule', 'description', 'lieu_intervention']
    ordering_fields = ['created_at', 'budget', 'urgence']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        if user.type_utilisateur == 'client':
            return Demande.objects.filter(client=user)
        return Demande.objects.filter(statut='ouverte')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return DemandeCreateSerializer
        return DemandeSerializer

class ServiceNeedDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Vue pour afficher, modifier et supprimer un besoin de service"""
    permission_classes = [permissions.IsAuthenticated, IsClientProvider]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return DemandeUpdateSerializer
        return DemandeSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.type_utilisateur == 'client':
            return Demande.objects.filter(client=user)
        return Demande.objects.filter(statut='ouverte')
    
    def perform_destroy(self, instance):
        """Log de la suppression et vérifications supplémentaires"""
        user = self.request.user
        
        # Vérifier que l'utilisateur est bien le propriétaire
        if instance.client != user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Vous n'êtes pas le propriétaire de ce besoin")
        
        # Log de la suppression
        print(f"Suppression du besoin {instance.id} par l'utilisateur {user.username}")
        
        # Supprimer l'instance
        instance.delete()

class ServiceTransactionListView(generics.ListAPIView):
    """Vue pour lister les transactions de l'utilisateur"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TransactionServiceSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['statut']
    ordering_fields = ['created_at', 'prix_final']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        return TransactionService.objects.filter(
            models.Q(fournisseur=user) | models.Q(client=user)
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_transaction(request):
    """Vue pour créer une transaction entre une offre et un besoin"""
    offer_id = request.data.get('offer_id')
    need_id = request.data.get('need_id')
    final_price = request.data.get('final_price')
    
    try:
        offer = Prestation.objects.get(id=offer_id, statut='active')
        need = Demande.objects.get(id=need_id, statut='ouverte')
        
        # Vérifier que l'utilisateur est autorisé
        if request.user.type_utilisateur == 'fournisseur' and offer.fournisseur != request.user:
            return Response(
                {'error': 'Vous n\'êtes pas autorisé à utiliser cette offre'},
                status=status.HTTP_403_FORBIDDEN
            )
        elif request.user.type_utilisateur == 'client' and need.client != request.user:
            return Response(
                {'error': 'Vous n\'êtes pas autorisé à utiliser ce besoin'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Créer la transaction
        transaction = TransactionService.objects.create(
            prestation=offer,
            besoin=need,
            fournisseur=offer.fournisseur,
            client=need.client,
            prix_final=final_price
        )
        
        # Mettre à jour le statut de l'offre et du besoin
        offer.statut = 'inactive'
        need.statut = 'en_cours'
        offer.save()
        need.save()
        
        serializer = TransactionServiceSerializer(transaction)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Prestation.DoesNotExist:
        return Response(
            {'error': 'Offre non trouvée ou non disponible'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Demande.DoesNotExist:
        return Response(
            {'error': 'Besoin non trouvé ou non disponible'},
            status=status.HTTP_404_NOT_FOUND
        )

class MessageListCreateView(generics.ListCreateAPIView):
    """Vue pour lister et créer des messages"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MessageSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['transaction', 'lu']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(
            models.Q(expediteur=user) | models.Q(destinataire=user)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(expediteur=self.request.user, lu=False)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_messages_read(request):
    """Vue pour marquer des messages comme lus"""
    message_ids = request.data.get('message_ids', [])
    
    updated = Message.objects.filter(
        id__in=message_ids,
        destinataire=request.user,
        lu=False
    ).update(lu=True)
    
    return Response({
        'message': f'{updated} message(s) marqué(s) comme lu(s)'
    })
