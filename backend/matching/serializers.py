from rest_framework import serializers
from services.serializers import PrestationSerializer, DemandeSerializer
from .models import MatchingScore

class MatchingScoreSerializer(serializers.ModelSerializer):
    """Serializer pour les scores de matching"""
    prestation_details = PrestationSerializer(source='offer', read_only=True)
    demande_details = DemandeSerializer(source='need', read_only=True)
    
    class Meta:
        model = MatchingScore
        fields = [
            'id', 'offer', 'need', 'score', 'details', 'calculated_at',
            'prestation_details', 'demande_details'
        ]
        read_only_fields = ['id', 'calculated_at']

class MatchResultSerializer(serializers.Serializer):
    """Serializer pour les résultats de matching"""
    prestation_id = serializers.IntegerField()
    demande_id = serializers.IntegerField()
    score = serializers.DecimalField(max_digits=5, decimal_places=2)
    prestation_details = PrestationSerializer(read_only=True)
    demande_details = DemandeSerializer(read_only=True)

# Alias pour compatibilité
MatchingScoreSerializer = MatchingScoreSerializer
MatchResultSerializer = MatchResultSerializer
