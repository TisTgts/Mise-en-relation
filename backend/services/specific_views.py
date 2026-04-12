"""
Vues spécifiques pour les offres et besoins avec permissions détaillées
"""
from rest_framework import generics, permissions, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models
from accounts.permissions import IsServiceProvider, IsClientProvider, IsOwnerOrReadOnly
from .models import CategorieService, Prestation, Demande, TransactionService, Message
from .serializers import (
    CategorieServiceSerializer,
    PrestationSerializer, 
    PrestationCreateSerializer,
    DemandeSerializer,
    DemandeCreateSerializer,
    TransactionServiceSerializer,
    MessageSerializer
)

class PublicOfferListView(generics.ListAPIView):
    """Vue publique pour lister les offres"""
    permission_classes = [permissions.AllowAny]
    serializer_class = PrestationSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['categorie', 'type_prestation', 'statut']
    search_fields = ['intitule', 'description', 'type_prestation']
    ordering_fields = ['created_at', 'tarif_min']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Prestation.objects.filter(statut='active')

class PublicNeedListView(generics.ListAPIView):
    """Vue publique pour lister les besoins"""
    permission_classes = [permissions.AllowAny]
    serializer_class = DemandeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['categorie', 'type_service', 'urgence', 'statut']
    search_fields = ['intitule', 'description', 'lieu_intervention']
    ordering_fields = ['created_at', 'budget', 'urgence']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Demande.objects.filter(statut='ouverte')

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def respond_to_offer(request, offer_id):
    """Répondre à une offre"""
    try:
        offer = Prestation.objects.get(id=offer_id)
        
        if request.user.type_utilisateur != 'client':
            return Response(
                {'error': 'Accès réservé aux clients'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Logique pour répondre à l'offre
        # Ici vous pouvez implémenter la logique de réponse
        
        return Response({
            'success': True,
            'message': 'Réponse enregistrée avec succès'
        })
        
    except Prestation.DoesNotExist:
        return Response(
            {'error': 'Offre non trouvée'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def respond_to_need(request, need_id):
    """Répondre à un besoin"""
    try:
        need = Demande.objects.get(id=need_id)
        
        if request.user.type_utilisateur != 'fournisseur':
            return Response(
                {'error': 'Accès réservé aux fournisseurs de services'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Logique pour répondre au besoin
        # Ici vous pouvez implémenter la logique de réponse
        
        return Response({
            'success': True,
            'message': 'Réponse enregistrée avec succès'
        })
        
    except Demande.DoesNotExist:
        return Response(
            {'error': 'Besoin non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )

class ProviderOfferListView(generics.ListCreateAPIView):
    """Vue pour les fournisseurs de services - gestion de leurs offres"""
    permission_classes = [permissions.IsAuthenticated, IsServiceProvider]
    serializer_class = PrestationSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['categorie', 'type_prestation', 'statut']
    search_fields = ['intitule', 'description', 'type_prestation']
    ordering_fields = ['created_at', 'tarif_min']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Prestation.objects.filter(fournisseur=self.request.user)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PrestationCreateSerializer
        return PrestationSerializer

class ClientNeedListView(generics.ListCreateAPIView):
    """Vue pour les fournisseurs clients - gestion de leurs besoins"""
    permission_classes = [permissions.IsAuthenticated, IsClientProvider]
    serializer_class = DemandeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['categorie', 'type_service', 'urgence', 'statut']
    search_fields = ['intitule', 'description', 'lieu_intervention']
    ordering_fields = ['created_at', 'budget', 'urgence']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Demande.objects.filter(client=self.request.user)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def service_categories(request):
    """Vue pour lister les catégories de services"""
    categories = CategorieService.objects.filter(est_active=True)
    serializer = CategorieServiceSerializer(categories, many=True)
    return Response(serializer.data)

@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated, IsServiceProvider])
def delete_offer(request, offer_id):
    """Vue dédiée pour la suppression d'une offre avec debug"""
    user = request.user
    
    # Vérifier que l'utilisateur est bien un fournisseur de services
    if user.type_utilisateur != 'fournisseur':
        return Response(
            {'error': 'Accès réservé aux fournisseurs de services'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        # Récupérer la prestation
        prestation = Prestation.objects.get(id=offer_id, fournisseur=user)
        
        # Log avant suppression
        print(f"Tentative de suppression de la prestation {prestation.id} par {user.username}")
        print(f"Prestation: {prestation.intitule}")
        
        # Supprimer
        prestation.delete()
        
        print(f"Prestation {prestation.id} supprimée avec succès")
        
        return Response(
            {'message': 'Prestation supprimée avec succès', 'prestation_id': offer_id},
            status=status.HTTP_200_OK
        )
        
    except Prestation.DoesNotExist:
        return Response(
            {'error': 'Prestation non trouvée'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print(f"Erreur lors de la suppression: {str(e)}")
        return Response(
            {'error': f'Erreur lors de la suppression: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_offers(request):
    """Vue pour lister les offres de l'utilisateur connecté"""
    if request.user.type_utilisateur != 'fournisseur':
        return Response(
            {'error': 'Accès réservé aux fournisseurs de services'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    offers = Prestation.objects.filter(fournisseur=request.user)
    serializer = PrestationSerializer(offers, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_needs(request):
    """Vue pour lister les besoins de l'utilisateur connecté"""
    if request.user.type_utilisateur != 'client':
        return Response(
            {'error': 'Accès réservé aux clients'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    needs = Demande.objects.filter(client=request.user)
    serializer = DemandeSerializer(needs, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def matching_needs(request):
    """Vue pour lister les besoins correspondants pour un fournisseur"""
    if request.user.type_utilisateur != 'fournisseur':
        return Response(
            {'error': 'Accès réservé aux fournisseurs de services'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Récupérer les offres du fournisseur
    provider_offers = Prestation.objects.filter(fournisseur=request.user)
    matching_needs_list = []
    
    # Pour chaque offre, trouver les besoins correspondants
    for offer in provider_offers:
        # Logique simple de matching basée sur la catégorie et le lieu
        potential_needs = Demande.objects.filter(
            categorie=offer.categorie,
            statut='ouverte'
        ).exclude(client=request.user)[:5]  # Limiter à 5 besoins par offre
        
        for need in potential_needs:
            matching_needs_list.append({
                'id': need.id,
                'intitule': need.intitule,
                'description': need.description[:200],  # Limiter la description
                'urgence': need.urgence,
                'budget': need.budget,
                'lieu_intervention': need.lieu_intervention,
                'created_at': need.created_at,
                'matching_offer': offer.intitule
            })
    
    # Trier par urgence et date
    matching_needs_list.sort(key=lambda x: (x['urgence'], x['created_at']), reverse=True)
    
    return Response({
        'count': len(matching_needs_list),
        'results': matching_needs_list[:10]  # Limiter à 10 résultats
    })

@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated, IsServiceProvider])
def update_offer_status(request, offer_id):
    """Vue pour mettre à jour le statut d'une offre"""
    try:
        offer = Prestation.objects.get(id=offer_id, fournisseur=request.user)
        
        new_status = request.data.get('status')
        if new_status in ['active', 'inactive', 'en_cours', 'terminee', 'annulee']:
            offer.statut = new_status
            offer.save()
            
            serializer = PrestationSerializer(offer)
            return Response({
                'success': True,
                'message': f'Statut mis à jour: {new_status}',
                'offer': serializer.data
            })
        else:
            return Response({
                'success': False,
                'error': 'Statut invalide'
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Prestation.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Offre non trouvée'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
