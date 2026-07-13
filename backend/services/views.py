from rest_framework import generics, permissions, status, filters
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models
from django.utils import timezone
from accounts.permissions import IsAdministrator
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
    search_fields = ['nom', 'categorie_principale', 'sous_categorie', 'description']
    
    def get_serializer_context(self):
        """Ajouter le contexte de requête pour le serializer"""
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

class ServiceOfferListCreateView(generics.ListCreateAPIView):
    """Vue pour lister et créer des offres de services"""
    permission_classes = [permissions.IsAuthenticated, IsServiceProvider]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['categorie', 'sous_categorie', 'type_prestation', 'statut']
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
    filterset_fields = ['categorie', 'sous_categorie', 'type_service', 'urgence', 'statut']
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
        if user.is_admin_type:
            return TransactionService.objects.all()
        return TransactionService.objects.filter(
            models.Q(fournisseur=user) | models.Q(client=user)
        )


class ServiceTransactionDetailView(generics.RetrieveUpdateAPIView):
    """Détail + mise à jour contrôlée d'une transaction"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TransactionServiceSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_admin_type:
            return TransactionService.objects.all()
        return TransactionService.objects.filter(
            models.Q(fournisseur=user) | models.Q(client=user)
        )


def _get_transaction_for_actor(user, transaction_id):
    qs = TransactionService.objects.select_related('fournisseur', 'client', 'prestation', 'besoin')
    if user.is_admin_type:
        return qs.filter(id=transaction_id).first()
    return qs.filter(id=transaction_id).filter(
        models.Q(fournisseur=user) | models.Q(client=user)
    ).first()


def _transaction_requires_quote_acceptance(transaction):
    besoin = transaction.besoin
    prestation = transaction.prestation
    return besoin.mode_budget == 'sur_devis' or prestation.mode_tarification == 'devis'


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsServiceProvider])
def fournisseur_work_done(request, transaction_id):
    transaction = _get_transaction_for_actor(request.user, transaction_id)
    if not transaction:
        return Response({'error': 'Transaction introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    if transaction.fournisseur_id != request.user.id:
        return Response({'error': 'Seul le fournisseur peut déclarer ce travail.'}, status=status.HTTP_403_FORBIDDEN)
    if _transaction_requires_quote_acceptance(transaction) and transaction.devis_statut != 'accepte_client':
        return Response(
            {'error': 'Le devis doit être accepté par le client avant le démarrage du travail.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    transaction.travail_fournisseur_termine = True
    transaction.travail_fournisseur_date = timezone.now()
    if transaction.statut in ['en_attente', 'acceptee']:
        transaction.statut = 'en_cours'
    transaction.save(update_fields=['travail_fournisseur_termine', 'travail_fournisseur_date', 'statut', 'updated_at'])
    return Response(TransactionServiceSerializer(transaction).data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsServiceProvider])
def fournisseur_propose_quote(request, transaction_id):
    transaction = _get_transaction_for_actor(request.user, transaction_id)
    if not transaction:
        return Response({'error': 'Transaction introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    if transaction.fournisseur_id != request.user.id:
        return Response({'error': 'Seul le fournisseur peut proposer un devis.'}, status=status.HTTP_403_FORBIDDEN)
    if not _transaction_requires_quote_acceptance(transaction):
        return Response(
            {'error': 'Cette collaboration ne nécessite pas de devis.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if transaction.statut in ['terminee', 'annulee']:
        return Response({'error': 'Transaction fermée, devis impossible.'}, status=status.HTTP_400_BAD_REQUEST)

    montant = request.data.get('montant')
    if montant in [None, '']:
        return Response({'error': 'Le montant du devis est requis.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        montant = float(montant)
    except (TypeError, ValueError):
        return Response({'error': 'Montant de devis invalide.'}, status=status.HTTP_400_BAD_REQUEST)
    if montant <= 0:
        return Response({'error': 'Le montant du devis doit être positif.'}, status=status.HTTP_400_BAD_REQUEST)

    transaction.devis_montant_propose = montant
    transaction.devis_description = str(request.data.get('description', '') or '')
    transaction.devis_statut = 'en_attente_client'
    transaction.devis_propose_par = request.user
    transaction.devis_date_proposition = timezone.now()
    transaction.devis_date_reponse_client = None
    transaction.prix_final = None
    transaction.save(update_fields=[
        'devis_montant_propose', 'devis_description', 'devis_statut',
        'devis_propose_par', 'devis_date_proposition', 'devis_date_reponse_client',
        'prix_final', 'updated_at'
    ])
    return Response(TransactionServiceSerializer(transaction).data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsClientProvider])
def client_respond_quote(request, transaction_id):
    transaction = _get_transaction_for_actor(request.user, transaction_id)
    if not transaction:
        return Response({'error': 'Transaction introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    if transaction.client_id != request.user.id:
        return Response({'error': 'Seul le client peut répondre au devis.'}, status=status.HTTP_403_FORBIDDEN)
    if not _transaction_requires_quote_acceptance(transaction):
        return Response(
            {'error': 'Cette collaboration ne nécessite pas de devis.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if transaction.devis_statut != 'en_attente_client':
        return Response({'error': 'Aucun devis en attente de validation client.'}, status=status.HTTP_400_BAD_REQUEST)

    decision = str(request.data.get('decision', '')).lower()
    if decision not in ['accepter', 'rejeter']:
        return Response({'error': 'Décision invalide. Utilisez accepter ou rejeter.'}, status=status.HTTP_400_BAD_REQUEST)

    transaction.devis_date_reponse_client = timezone.now()
    if decision == 'accepter':
        transaction.devis_statut = 'accepte_client'
        transaction.prix_final = transaction.devis_montant_propose
        if transaction.statut == 'en_attente':
            transaction.statut = 'acceptee'
    else:
        transaction.devis_statut = 'rejete_client'
        transaction.prix_final = None

    transaction.save(update_fields=['devis_statut', 'devis_date_reponse_client', 'prix_final', 'statut', 'updated_at'])
    return Response(TransactionServiceSerializer(transaction).data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsClientProvider])
def client_verify_work(request, transaction_id):
    transaction = _get_transaction_for_actor(request.user, transaction_id)
    if not transaction:
        return Response({'error': 'Transaction introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    if transaction.client_id != request.user.id:
        return Response({'error': 'Seul le client peut vérifier ce travail.'}, status=status.HTTP_403_FORBIDDEN)
    if not transaction.travail_fournisseur_termine:
        return Response({'error': 'Le fournisseur n’a pas encore déclaré le travail effectué.'}, status=status.HTTP_400_BAD_REQUEST)

    approved = bool(request.data.get('approved', True))
    transaction.verification_client_effectuee = True
    transaction.verification_client_validee = approved
    transaction.verification_client_date = timezone.now()
    transaction.save(update_fields=['verification_client_effectuee', 'verification_client_validee', 'verification_client_date', 'updated_at'])
    return Response(TransactionServiceSerializer(transaction).data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def request_admin_approval(request, transaction_id):
    transaction = _get_transaction_for_actor(request.user, transaction_id)
    if not transaction:
        return Response({'error': 'Transaction introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    if request.user.type_utilisateur not in ['client', 'fournisseur']:
        return Response({'error': 'Action non autorisée.'}, status=status.HTTP_403_FORBIDDEN)

    transaction.demande_validation_admin = True
    transaction.demande_validation_admin_date = timezone.now()
    transaction.validation_admin_statut = 'en_attente'
    transaction.save(update_fields=['demande_validation_admin', 'demande_validation_admin_date', 'validation_admin_statut', 'updated_at'])
    return Response(TransactionServiceSerializer(transaction).data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsClientProvider])
def client_confirm_transaction(request, transaction_id):
    transaction = _get_transaction_for_actor(request.user, transaction_id)
    if not transaction:
        return Response({'error': 'Transaction introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    if transaction.client_id != request.user.id:
        return Response({'error': 'Seul le client peut confirmer la transaction.'}, status=status.HTTP_403_FORBIDDEN)
    if not transaction.verification_client_effectuee or not transaction.verification_client_validee:
        return Response({'error': 'La vérification client validée est requise.'}, status=status.HTTP_400_BAD_REQUEST)
    if transaction.demande_validation_admin and transaction.validation_admin_statut == 'en_attente':
        return Response({'error': 'Une validation admin est en attente.'}, status=status.HTTP_400_BAD_REQUEST)

    transaction.fin_confirmee = True
    transaction.heure_fin = timezone.now()
    transaction.statut = 'terminee'
    transaction.save(update_fields=['fin_confirmee', 'heure_fin', 'statut', 'updated_at'])
    return Response(TransactionServiceSerializer(transaction).data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsAdministrator])
def admin_decide_transaction(request, transaction_id):
    transaction = _get_transaction_for_actor(request.user, transaction_id)
    if not transaction:
        return Response({'error': 'Transaction introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    if transaction.validation_admin_statut != 'en_attente':
        return Response(
            {'error': 'Aucune validation admin en attente pour cette transaction.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    decision = str(request.data.get('decision', '')).lower()
    if decision not in ['accepter', 'rejeter']:
        return Response({'error': 'Décision invalide. Utilisez accepter ou rejeter.'}, status=status.HTTP_400_BAD_REQUEST)

    now = timezone.now()
    transaction.validation_admin_par = request.user
    transaction.validation_admin_date = now
    if decision == 'accepter':
        transaction.validation_admin_statut = 'acceptee'
        transaction.fin_confirmee = True
        transaction.heure_fin = now
        transaction.statut = 'terminee'
    else:
        transaction.validation_admin_statut = 'rejetee'
    transaction.save(update_fields=[
        'validation_admin_par', 'validation_admin_date', 'validation_admin_statut',
        'fin_confirmee', 'heure_fin', 'statut', 'updated_at'
    ])
    return Response(TransactionServiceSerializer(transaction).data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsAdministrator])
def admin_finalize_transaction(request, transaction_id):
    """Clôture côté admin lorsque le travail est validé par le client (équivalent à la confirmation client)."""
    transaction = _get_transaction_for_actor(request.user, transaction_id)
    if not transaction:
        return Response({'error': 'Transaction introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    if transaction.statut == 'terminee':
        return Response({'error': 'Transaction déjà terminée.'}, status=status.HTTP_400_BAD_REQUEST)
    if not transaction.travail_fournisseur_termine:
        return Response(
            {'error': 'Le fournisseur doit avoir déclaré le travail effectué.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not transaction.verification_client_effectuee or not transaction.verification_client_validee:
        return Response(
            {'error': 'La vérification client positive est requise avant clôture.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if transaction.validation_admin_statut == 'en_attente':
        return Response(
            {'error': 'Traitez d’abord la demande de validation admin (accepter ou rejeter).'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if transaction.demande_validation_admin and transaction.validation_admin_statut != 'acceptee':
        return Response(
            {'error': 'La validation admin doit être acceptée pour clôturer cette transaction.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    now = timezone.now()
    transaction.fin_confirmee = True
    transaction.heure_fin = now
    transaction.statut = 'terminee'
    transaction.save(update_fields=['fin_confirmee', 'heure_fin', 'statut', 'updated_at'])
    return Response(TransactionServiceSerializer(transaction).data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def transaction_besoin_details(request, transaction_id):
    """Retourne le besoin lié à une transaction si l'acteur y est autorisé."""
    transaction = _get_transaction_for_actor(request.user, transaction_id)
    if not transaction:
        return Response({'error': 'Transaction introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(DemandeSerializer(transaction.besoin).data, status=status.HTTP_200_OK)


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
        quote_required = need.mode_budget == 'sur_devis' or offer.mode_tarification == 'devis'
        tx_fields = {
            'prestation': offer,
            'besoin': need,
            'fournisseur': offer.fournisseur,
            'client': need.client,
        }
        if quote_required:
            if final_price not in [None, '']:
                tx_fields['devis_montant_propose'] = final_price
                tx_fields['devis_statut'] = 'en_attente_client'
                tx_fields['devis_date_proposition'] = timezone.now()
                tx_fields['devis_propose_par'] = request.user if request.user.type_utilisateur == 'fournisseur' else None
            else:
                tx_fields['devis_statut'] = 'a_proposer'
            tx_fields['prix_final'] = None
        else:
            tx_fields['devis_statut'] = 'non_requis'
            tx_fields['prix_final'] = final_price

        transaction = TransactionService.objects.create(
            **tx_fields
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
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin_type:
            return Message.objects.all()
        return Message.objects.filter(
            models.Q(expediteur=user) | models.Q(destinataire=user)
        ).distinct()

    def perform_create(self, serializer):
        transaction = serializer.validated_data.get('transaction')
        if transaction and transaction.statut in ['annulee', 'terminee']:
            raise ValidationError("Cette conversation est fermée. Aucun nouveau message n'est autorisé.")
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
