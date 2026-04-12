from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from services.models import ServiceOffer, ServiceNeed
from .services import MatchingService
from .serializers import MatchingScoreSerializer, MatchResultSerializer

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def find_matches_for_need(request, need_id):
    """Trouve les meilleures offres pour un besoin donné"""
    need = get_object_or_404(ServiceNeed, id=need_id)
    
    # Vérifier que l'utilisateur est autorisé
    if request.user.user_type == 'seeker' and need.seeker != request.user:
        return Response(
            {'error': 'Vous n\'êtes pas autorisé à accéder à ce besoin'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    matching_service = MatchingService()
    matches = matching_service.find_matches_for_need(need)
    
    # Préparer les données de réponse
    results = []
    for match in matches:
        results.append({
            'offer_id': match['offer'].id,
            'need_id': need.id,
            'score': match['score'],
            'offer_details': {
                'id': match['offer'].id,
                'title': match['offer'].title,
                'provider': match['offer'].provider.username,
                'service_type': match['offer'].service_type,
                'specifications': match['offer'].specifications,
                'service_areas': match['offer'].service_areas,
                'pricing_model': match['offer'].pricing_model,
                'price_range_min': match['offer'].price_range_min,
                'price_range_max': match['offer'].price_range_max,
            },
            'need_details': {
                'id': need.id,
                'title': need.title,
                'seeker': need.seeker.username,
                'service_type': need.service_type,
                'requirements': need.requirements,
                'service_location': need.service_location,
                'budget': need.budget,
            }
        })
    
    return Response({
        'need_id': need_id,
        'matches': results,
        'total_matches': len(results)
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def find_matches_for_offer(request, offer_id):
    """Trouve les meilleurs besoins pour une offre donnée"""
    offer = get_object_or_404(ServiceOffer, id=offer_id)
    
    # Vérifier que l'utilisateur est autorisé
    if request.user.user_type == 'provider' and offer.provider != request.user:
        return Response(
            {'error': 'Vous n\'êtes pas autorisé à accéder à cette offre'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    matching_service = MatchingService()
    matches = matching_service.find_matches_for_offer(offer)
    
    # Préparer les données de réponse
    results = []
    for match in matches:
        results.append({
            'offer_id': offer.id,
            'need_id': match['need'].id,
            'score': match['score'],
            'offer_details': {
                'id': offer.id,
                'title': offer.title,
                'provider': offer.provider.username,
                'service_type': offer.service_type,
                'specifications': offer.specifications,
                'service_areas': offer.service_areas,
                'pricing_model': offer.pricing_model,
                'price_range_min': offer.price_range_min,
                'price_range_max': offer.price_range_max,
            },
            'need_details': {
                'id': match['need'].id,
                'title': match['need'].title,
                'seeker': match['need'].seeker.username,
                'service_type': match['need'].service_type,
                'requirements': match['need'].requirements,
                'service_location': match['need'].service_location,
                'budget': match['need'].budget,
            }
        })
    
    return Response({
        'offer_id': offer_id,
        'matches': results,
        'total_matches': len(results)
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_matching_scores(request):
    """Obtenir les scores de matching pour l'utilisateur"""
    user = request.user
    scores = []
    
    if user.user_type == 'provider':
        # Scores pour les offres du provider
        user_offers = ServiceOffer.objects.filter(provider=user)
        for offer in user_offers:
            offer_scores = offer.matching_scores.all().order_by('-score')[:10]
            scores.extend(offer_scores)
    elif user.user_type == 'seeker':
        # Scores pour les besoins du seeker
        user_needs = ServiceNeed.objects.filter(seeker=user)
        for need in user_needs:
            need_scores = need.matching_scores.all().order_by('-score')[:10]
            scores.extend(need_scores)
    
    # Trier par score décroissant
    scores.sort(key=lambda x: x.score, reverse=True)
    
    serializer = MatchingScoreSerializer(scores[:20], many=True)
    return Response(serializer.data)
