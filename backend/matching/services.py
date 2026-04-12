from django.db.models import Q
from decimal import Decimal
from services.models import ServiceOffer, ServiceNeed
from .models import MatchingScore, MatchingRule

class MatchingService:
    """Service pour le matching entre offres et besoins de services"""
    
    def __init__(self):
        self.rules = MatchingRule.objects.filter(is_active=True)
    
    def calculate_service_type_score(self, offer, need):
        """Calcule le score de correspondance pour le type de service"""
        if offer.service_type.lower() == need.service_type.lower():
            return Decimal('100.0')
        return Decimal('0.0')
    
    def calculate_location_score(self, offer, need):
        """Calcule le score de correspondance pour la localisation"""
        # Vérifier si les zones de service correspondent
        offer_areas = [area.lower() for area in offer.service_areas]
        need_location = need.service_location.lower()
        
        for area in offer_areas:
            if area in need_location or need_location in area:
                return Decimal('100.0')
        
        return Decimal('0.0')
    
    def calculate_availability_score(self, offer, need):
        """Calcule le score de correspondance pour la disponibilité"""
        if (offer.availability_start <= need.preferred_date and 
            offer.availability_end >= need.deadline):
            return Decimal('100.0')
        elif (offer.availability_start <= need.preferred_date and 
              offer.availability_end >= need.preferred_date):
            return Decimal('50.0')
        return Decimal('0.0')
    
    def calculate_price_score(self, offer, need):
        """Calcule le score de correspondance pour le prix"""
        if offer.price_range_min and offer.price_range_max:
            if offer.price_range_min <= need.budget <= offer.price_range_max:
                return Decimal('100.0')
            elif need.budget >= offer.price_range_min:
                ratio = need.budget / offer.price_range_max
                if ratio >= 0.8:
                    return Decimal('75.0')
                else:
                    return Decimal('50.0')
            else:
                return Decimal('25.0')
        elif offer.price_range_min:
            if need.budget >= offer.price_range_min:
                return Decimal('80.0')
            else:
                return Decimal('30.0')
        elif offer.price_range_max:
            if need.budget <= offer.price_range_max:
                return Decimal('80.0')
            else:
                return Decimal('30.0')
        
        return Decimal('50.0')  # Score neutre si pas de prix spécifié
    
    def calculate_overall_score(self, offer, need):
        """Calcule le score global de matching"""
        # Scores individuels
        service_type_score = self.calculate_service_type_score(offer, need)
        location_score = self.calculate_location_score(offer, need)
        availability_score = self.calculate_availability_score(offer, need)
        price_score = self.calculate_price_score(offer, need)
        
        # Pondération (peut être configurée via les règles)
        weights = {
            'service_type': Decimal('0.4'),
            'location': Decimal('0.3'),
            'availability': Decimal('0.2'),
            'price': Decimal('0.1')
        }
        
        # Calcul du score pondéré
        overall_score = (
            service_type_score * weights['service_type'] +
            location_score * weights['location'] +
            availability_score * weights['availability'] +
            price_score * weights['price']
        )
        
        return overall_score.quantize(Decimal('0.01'))
    
    def find_matches_for_need(self, need, limit=10):
        """Trouve les meilleures offres pour un besoin donné"""
        # Filtrer les offres actives
        active_offers = ServiceOffer.objects.filter(status='active')
        
        matches = []
        for offer in active_offers:
            score = self.calculate_overall_score(offer, need)
            if score > 0:  # Ne considérer que les correspondances valides
                matches.append({
                    'offer': offer,
                    'score': score
                })
        
        # Trier par score décroissant
        matches.sort(key=lambda x: x['score'], reverse=True)
        
        # Sauvegarder les scores dans la base de données
        for match in matches[:limit]:
            MatchingScore.objects.update_or_create(
                offer=match['offer'],
                need=need,
                defaults={
                    'score': match['score'],
                    'details': {
                        'service_type_score': float(self.calculate_service_type_score(match['offer'], need)),
                        'location_score': float(self.calculate_location_score(match['offer'], need)),
                        'availability_score': float(self.calculate_availability_score(match['offer'], need)),
                        'price_score': float(self.calculate_price_score(match['offer'], need))
                    }
                }
            )
        
        return matches[:limit]
    
    def find_matches_for_offer(self, offer, limit=10):
        """Trouve les meilleurs besoins pour une offre donnée"""
        # Filtrer les besoins ouverts
        open_needs = ServiceNeed.objects.filter(status='open')
        
        matches = []
        for need in open_needs:
            score = self.calculate_overall_score(offer, need)
            if score > 0:  # Ne considérer que les correspondances valides
                matches.append({
                    'need': need,
                    'score': score
                })
        
        # Trier par score décroissant
        matches.sort(key=lambda x: x['score'], reverse=True)
        
        # Sauvegarder les scores dans la base de données
        for match in matches[:limit]:
            MatchingScore.objects.update_or_create(
                offer=offer,
                need=match['need'],
                defaults={
                    'score': match['score'],
                    'details': {
                        'service_type_score': float(self.calculate_service_type_score(offer, match['need'])),
                        'location_score': float(self.calculate_location_score(offer, match['need'])),
                        'availability_score': float(self.calculate_availability_score(offer, match['need'])),
                        'price_score': float(self.calculate_price_score(offer, match['need']))
                    }
                }
            )
        
        return matches[:limit]
