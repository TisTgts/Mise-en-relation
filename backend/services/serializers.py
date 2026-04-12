from rest_framework import serializers
from .models import CategorieService, Prestation, Demande, TransactionService, Message

class CategorieServiceSerializer(serializers.ModelSerializer):
    """Serializer pour les catégories de services"""
    
    class Meta:
        model = CategorieService
        fields = ['id', 'nom', 'description', 'parent', 'est_active', 'created_at']
        read_only_fields = ['id', 'created_at']

class PrestationSerializer(serializers.ModelSerializer):
    """Serializer pour les prestations de services"""
    prestataire_nom = serializers.CharField(source='prestataire.username', read_only=True)
    prestataire_note = serializers.DecimalField(
        source='prestataire.profile_prestataire.note_moyenne', 
        max_digits=3, 
        decimal_places=2, 
        read_only=True
    )
    categorie_nom = serializers.CharField(source='categorie.nom', read_only=True)
    
    class Meta:
        model = Prestation
        fields = [
            'id', 'prestataire', 'prestataire_nom', 'prestataire_note',
            'categorie', 'categorie_nom', 'intitule', 'description', 
            'type_prestation', 'caracteristiques', 'zones_intervention',
            'disponibilite_debut', 'disponibilite_fin', 'mode_tarification',
            'tarif_min', 'tarif_max', 'statut', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class PrestationCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création de prestations"""
    
    class Meta:
        model = Prestation
        fields = [
            'categorie', 'intitule', 'description', 'type_prestation',
            'caracteristiques', 'zones_intervention', 'disponibilite_debut',
            'disponibilite_fin', 'mode_tarification', 'tarif_min', 'tarif_max'
        ]
    
    def create(self, validated_data):
        validated_data['prestataire'] = self.context['request'].user
        return super().create(validated_data)

class PrestationUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour la mise à jour des prestations"""
    
    class Meta:
        model = Prestation
        fields = [
            'categorie', 'intitule', 'description', 'type_prestation',
            'caracteristiques', 'zones_intervention', 'disponibilite_debut',
            'disponibilite_fin', 'mode_tarification', 'tarif_min', 'tarif_max', 'statut'
        ]

class DemandeSerializer(serializers.ModelSerializer):
    """Serializer pour les demandes de services"""
    fournisseur_nom = serializers.CharField(source='fournisseur.username', read_only=True)
    fournisseur_id = serializers.IntegerField(source='fournisseur.id', read_only=True)
    fournisseur_email = serializers.CharField(source='fournisseur.email', read_only=True)
    categorie_nom = serializers.CharField(source='categorie.nom', read_only=True)
    
    class Meta:
        model = Demande
        fields = [
            'id', 'fournisseur', 'fournisseur_nom', 'fournisseur_id', 'fournisseur_email',
            'categorie', 'categorie_nom', 'intitule', 'description', 'type_service', 'exigences',
            'lieu_intervention', 'date_souhaitee', 'date_limite', 'urgence',
            'budget', 'flexible', 'statut', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class DemandeUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour la mise à jour des demandes"""
    
    class Meta:
        model = Demande
        fields = [
            'categorie', 'intitule', 'description', 'type_service',
            'exigences', 'lieu_intervention', 'date_souhaitee', 'date_limite',
            'urgence', 'budget', 'flexible', 'statut'
        ]

class DemandeCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création de demandes"""
    
    class Meta:
        model = Demande
        fields = [
            'categorie', 'intitule', 'description', 'type_service',
            'exigences', 'lieu_intervention', 'date_souhaitee', 'date_limite',
            'urgence', 'budget', 'flexible'
        ]
    
    def create(self, validated_data):
        validated_data['fournisseur'] = self.context['request'].user
        return super().create(validated_data)

class TransactionServiceSerializer(serializers.ModelSerializer):
    """Serializer pour les transactions de services"""
    prestataire_nom = serializers.CharField(source='prestataire.username', read_only=True)
    fournisseur_nom = serializers.CharField(source='fournisseur.username', read_only=True)
    prestation_intitule = serializers.CharField(source='prestation.intitule', read_only=True)
    demande_intitule = serializers.CharField(source='demande.intitule', read_only=True)
    
    class Meta:
        model = TransactionService
        fields = [
            'id', 'prestation', 'demande', 'prestataire', 'fournisseur',
            'prestataire_nom', 'fournisseur_nom', 'prestation_intitule', 'demande_intitule',
            'prix_final', 'statut', 'debut_confirme', 'fin_confirmee',
            'heure_debut', 'heure_fin', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class MessageSerializer(serializers.ModelSerializer):
    """Serializer pour les messages"""
    expediteur_nom = serializers.CharField(source='expediteur.username', read_only=True)
    destinataire_nom = serializers.CharField(source='destinataire.username', read_only=True)
    
    class Meta:
        model = Message
        fields = [
            'id', 'expediteur', 'destinataire', 'transaction',
            'expediteur_nom', 'destinataire_nom', 'sujet', 'contenu',
            'lu', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

# Alias pour compatibilité
ServiceCategorySerializer = CategorieServiceSerializer
ServiceOfferSerializer = PrestationSerializer
ServiceOfferCreateSerializer = PrestationCreateSerializer
ServiceNeedSerializer = DemandeSerializer
ServiceNeedCreateSerializer = DemandeCreateSerializer
ServiceTransactionSerializer = TransactionServiceSerializer
