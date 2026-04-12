from rest_framework import serializers
from services.serializers import PrestationSerializer, BesoinSerializer
from .models import MatchingScore


class MatchingScoreSerializer(serializers.ModelSerializer):
    prestation_details = PrestationSerializer(source='offer', read_only=True)
    besoin_details = BesoinSerializer(source='need', read_only=True)

    class Meta:
        model = MatchingScore
        fields = [
            'id', 'offer', 'need', 'score', 'details', 'calculated_at',
            'prestation_details', 'besoin_details'
        ]
        read_only_fields = ['id', 'calculated_at']


class MatchResultSerializer(serializers.Serializer):
    """Compatibilité import (matching/views)."""
    pass
