from rest_framework import serializers
from .models import CategorieService, SousCategorieService, Prestation, Besoin, TransactionService, Message, Avis
from .taxonomy import normalize_text, overlap_strength, required_fields_for_besoin_category, tokenize


def _provider_profile_tokens(user):
    profile = getattr(user, "profile_fournisseur", None)
    offered = getattr(profile, "types_services_offerts", []) or []
    tokens = set()
    for item in offered:
        tokens.update(tokenize([item]))
    return tokens


def _prestation_tokens(validated_data):
    tokens = set()
    categorie = validated_data.get("categorie")
    sous_categorie = validated_data.get("sous_categorie")
    type_prestation = validated_data.get("type_prestation")

    if categorie is not None:
        tokens.update(tokenize([getattr(categorie, "nom", "")]))
    if sous_categorie is not None:
        tokens.update(tokenize([getattr(sous_categorie, "nom", "")]))
    tokens.update(tokenize([type_prestation]))
    return tokens


def _has_semantic_overlap(provider_tokens, prestation_tokens):
    return overlap_strength(provider_tokens, prestation_tokens) > 0


def _validate_prestation_profile_coherence(user, attrs):
    if getattr(user, "type_utilisateur", None) != "fournisseur":
        return attrs

    provider_tokens = _provider_profile_tokens(user)
    if not provider_tokens:
        raise serializers.ValidationError(
            {
                "type_prestation": (
                    "Complétez d'abord votre profil fournisseur (types de services offerts) "
                    "avant d'ajouter une prestation."
                )
            }
        )

    prestation_tokens = _prestation_tokens(attrs)
    if not _has_semantic_overlap(provider_tokens, prestation_tokens):
        raise serializers.ValidationError(
            {
                "type_prestation": (
                    "Cette prestation ne correspond pas à votre profil fournisseur. "
                    "Choisissez une catégorie/type cohérent avec vos services offerts."
                )
            }
        )
    return attrs


def _validate_besoin_category_exigences(attrs):
    categorie = attrs.get("categorie")
    exigences = attrs.get("exigences")
    if categorie is None:
        return attrs

    if exigences is None:
        exigences = {}
    if not isinstance(exigences, dict):
        raise serializers.ValidationError({"exigences": "Le champ exigences doit être un objet JSON."})

    required_fields = required_fields_for_besoin_category(getattr(categorie, "nom", ""))
    missing = []
    for field in required_fields:
        value = exigences.get(field)
        if value is None:
            missing.append(field)
            continue
        if isinstance(value, str) and not normalize_text(value):
            missing.append(field)

    if missing:
        raise serializers.ValidationError(
            {
                "exigences": (
                    "Champs obligatoires manquants pour cette catégorie: "
                    + ", ".join(missing)
                )
            }
        )
    return attrs


def _validate_besoin_budget_mode(attrs):
    mode_budget = attrs.get("mode_budget", "budget_fixe")
    budget = attrs.get("budget")
    if mode_budget == "budget_fixe" and budget is None:
        raise serializers.ValidationError(
            {"budget": "Le budget est requis quand le besoin est en mode budget fixe."}
        )
    return attrs


class CategorieServiceSerializer(serializers.ModelSerializer):
    """Serializer pour les catégories de services"""
    sous_categories = serializers.SerializerMethodField()

    def get_sous_categories(self, obj):
        return [
            {"id": sc.id, "nom": sc.nom}
            for sc in obj.sous_categories.filter(est_active=True).order_by("nom")
        ]

    class Meta:
        model = CategorieService
        fields = [
            'id', 'nom', 'description', 'est_active', 'created_at', 'sous_categories'
        ]
        read_only_fields = ['id', 'created_at']


class SousCategorieServiceSerializer(serializers.ModelSerializer):
    categorie_nom = serializers.CharField(source='categorie.nom', read_only=True)

    class Meta:
        model = SousCategorieService
        fields = ['id', 'categorie', 'categorie_nom', 'nom', 'description', 'est_active', 'created_at']
        read_only_fields = ['id', 'created_at']

class PrestationSerializer(serializers.ModelSerializer):
    """Serializer pour les prestations de services"""
    fournisseur_nom = serializers.CharField(source='fournisseur.username', read_only=True)
    fournisseur_note = serializers.DecimalField(
        source='fournisseur.profile_fournisseur.note_moyenne',
        max_digits=3,
        decimal_places=2,
        read_only=True
    )
    categorie_nom = serializers.CharField(source='categorie.nom', read_only=True)
    sous_categorie_nom = serializers.CharField(source='sous_categorie.nom', read_only=True)
    
    class Meta:
        model = Prestation
        fields = [
            'id', 'fournisseur', 'fournisseur_nom', 'fournisseur_note',
            'categorie', 'categorie_nom', 'sous_categorie', 'sous_categorie_nom', 'intitule', 'description',
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
            'sous_categorie', 'caracteristiques', 'zones_intervention', 'disponibilite_debut',
            'disponibilite_fin', 'mode_tarification', 'tarif_min', 'tarif_max'
        ]

    def validate(self, attrs):
        return _validate_prestation_profile_coherence(self.context["request"].user, attrs)
    
    def create(self, validated_data):
        validated_data['fournisseur'] = self.context['request'].user
        return super().create(validated_data)

class PrestationUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour la mise à jour des prestations"""
    
    class Meta:
        model = Prestation
        fields = [
            'categorie', 'intitule', 'description', 'type_prestation',
            'sous_categorie', 'caracteristiques', 'zones_intervention', 'disponibilite_debut',
            'disponibilite_fin', 'mode_tarification', 'tarif_min', 'tarif_max', 'statut'
        ]

    def validate(self, attrs):
        # Ne vérifier la cohérence profil/prestation que si la valeur métier
        # change réellement (et pas seulement parce que le champ est présent dans le payload).
        instance = self.instance
        should_validate_profile = False

        if instance is None:
            should_validate_profile = any(
                key in attrs for key in ("categorie", "sous_categorie", "type_prestation")
            )
        else:
            if "categorie" in attrs and attrs.get("categorie") != instance.categorie:
                should_validate_profile = True
            if "sous_categorie" in attrs and attrs.get("sous_categorie") != instance.sous_categorie:
                should_validate_profile = True
            if "type_prestation" in attrs:
                incoming = (attrs.get("type_prestation") or "").strip()
                current = (instance.type_prestation or "").strip()
                if incoming != current:
                    should_validate_profile = True

        if should_validate_profile:
            merged = {
                "categorie": attrs.get("categorie", instance.categorie if instance else None),
                "sous_categorie": attrs.get("sous_categorie", instance.sous_categorie if instance else None),
                "type_prestation": attrs.get("type_prestation", instance.type_prestation if instance else ""),
            }
            _validate_prestation_profile_coherence(self.context["request"].user, merged)
        return attrs

class BesoinSerializer(serializers.ModelSerializer):
    """Serializer pour les besoins de services"""
    client_nom = serializers.CharField(source='client.username', read_only=True)
    client_id = serializers.IntegerField(source='client.id', read_only=True)
    client_email = serializers.CharField(source='client.email', read_only=True)
    categorie_nom = serializers.CharField(source='categorie.nom', read_only=True)
    sous_categorie_nom = serializers.CharField(source='sous_categorie.nom', read_only=True)
    
    class Meta:
        model = Besoin
        fields = [
            'id', 'client', 'client_nom', 'client_id', 'client_email',
            'categorie', 'categorie_nom', 'sous_categorie', 'sous_categorie_nom', 'intitule', 'description', 'type_service', 'exigences',
            'lieu_intervention', 'date_souhaitee', 'date_limite', 'urgence',
            'budget', 'mode_budget', 'flexible', 'statut', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class BesoinUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour la mise à jour des besoins"""
    
    class Meta:
        model = Besoin
        fields = [
            'categorie', 'intitule', 'description', 'type_service',
            'sous_categorie', 'exigences', 'lieu_intervention', 'date_souhaitee', 'date_limite',
            'urgence', 'budget', 'mode_budget', 'flexible', 'statut'
        ]

    def validate(self, attrs):
        instance = self.instance
        merged = {
            "categorie": attrs.get("categorie", instance.categorie if instance else None),
            "exigences": attrs.get("exigences", instance.exigences if instance else {}),
            "mode_budget": attrs.get("mode_budget", instance.mode_budget if instance else "budget_fixe"),
            "budget": attrs.get("budget", instance.budget if instance else None),
        }

        # N'imposer les exigences de catégorie que si les champs métier concernés changent.
        if any(key in attrs for key in ("categorie", "sous_categorie", "type_service", "exigences")):
            _validate_besoin_category_exigences(merged)

        # N'imposer la cohérence budget/mode que si la tarification est modifiée.
        if any(key in attrs for key in ("mode_budget", "budget")):
            _validate_besoin_budget_mode(merged)
        return attrs

class BesoinCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création de besoins"""
    
    class Meta:
        model = Besoin
        fields = [
            'categorie', 'intitule', 'description', 'type_service',
            'sous_categorie', 'exigences', 'lieu_intervention', 'date_souhaitee', 'date_limite',
            'urgence', 'budget', 'mode_budget', 'flexible'
        ]

    def validate(self, attrs):
        _validate_besoin_category_exigences(attrs)
        _validate_besoin_budget_mode(attrs)
        return attrs
    
    def create(self, validated_data):
        validated_data['client'] = self.context['request'].user
        return super().create(validated_data)

class TransactionServiceSerializer(serializers.ModelSerializer):
    """Serializer pour les transactions de services"""
    fournisseur_nom = serializers.CharField(source='fournisseur.username', read_only=True)
    client_nom = serializers.CharField(source='client.username', read_only=True)
    prestation_intitule = serializers.CharField(source='prestation.intitule', read_only=True)
    besoin_intitule = serializers.CharField(source='besoin.intitule', read_only=True)
    besoin_mode_budget = serializers.CharField(source='besoin.mode_budget', read_only=True)
    besoin_lieu_intervention = serializers.CharField(source='besoin.lieu_intervention', read_only=True)
    prestation_mode_tarification = serializers.CharField(
        source='prestation.mode_tarification', read_only=True
    )
    avis = serializers.SerializerMethodField()
    
    class Meta:
        model = TransactionService
        fields = [
            'id', 'prestation', 'besoin', 'fournisseur', 'client',
            'fournisseur_nom', 'client_nom', 'prestation_intitule', 'besoin_intitule',
            'besoin_mode_budget', 'besoin_lieu_intervention', 'prestation_mode_tarification',
            'prix_final', 'statut', 'debut_confirme', 'fin_confirmee',
            'devis_montant_propose', 'devis_description', 'devis_statut',
            'devis_date_proposition', 'devis_date_reponse_client', 'devis_propose_par',
            'heure_debut', 'heure_fin',
            'travail_fournisseur_termine', 'travail_fournisseur_date',
            'verification_client_effectuee', 'verification_client_validee', 'verification_client_date',
            'demande_validation_admin', 'demande_validation_admin_date',
            'validation_admin_statut', 'validation_admin_date', 'validation_admin_par',
            'notes', 'created_at', 'updated_at', 'avis',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_avis(self, obj):
        try:
            avis = obj.avis
        except Avis.DoesNotExist:
            return None
        auteur = avis.auteur
        auteur_label = f'{auteur.first_name} {auteur.last_name}'.strip() or auteur.username
        return {
            'id': avis.id,
            'rating': avis.note,
            'comment': avis.commentaire,
            'date': avis.created_at,
            'auteur': auteur_label,
        }


class AvisSerializer(serializers.ModelSerializer):
    auteur_nom = serializers.SerializerMethodField()

    class Meta:
        model = Avis
        fields = ['id', 'transaction', 'note', 'commentaire', 'auteur_nom', 'created_at']
        read_only_fields = ['id', 'auteur_nom', 'created_at']

    def validate_note(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError('La note doit être entre 1 et 5.')
        return value

    def get_auteur_nom(self, obj):
        auteur = obj.auteur
        return f'{auteur.first_name} {auteur.last_name}'.strip() or auteur.username

class MessageSerializer(serializers.ModelSerializer):
    """Serializer pour les messages"""
    expediteur_nom = serializers.CharField(source='expediteur.username', read_only=True)
    destinataire_nom = serializers.CharField(source='destinataire.username', read_only=True)
    piece_jointe_url = serializers.SerializerMethodField()
    piece_jointe_nom = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = [
            'id', 'expediteur', 'destinataire', 'transaction',
            'expediteur_nom', 'destinataire_nom', 'sujet', 'contenu',
            'piece_jointe', 'piece_jointe_url', 'piece_jointe_nom',
            'lu', 'created_at'
        ]
        read_only_fields = ['id', 'expediteur', 'lu', 'created_at']

    def get_piece_jointe_url(self, obj):
        if not obj.piece_jointe:
            return None
        request = self.context.get('request')
        if request is None:
            return obj.piece_jointe.url
        return request.build_absolute_uri(obj.piece_jointe.url)

    def get_piece_jointe_nom(self, obj):
        if not obj.piece_jointe:
            return None
        return obj.piece_jointe.name.split('/')[-1]

# Alias pour compatibilité
ServiceCategorySerializer = CategorieServiceSerializer
ServiceOfferSerializer = PrestationSerializer
ServiceOfferCreateSerializer = PrestationCreateSerializer
ServiceNeedSerializer = BesoinSerializer
ServiceNeedCreateSerializer = BesoinCreateSerializer
ServiceNeedUpdateSerializer = BesoinUpdateSerializer
DemandeSerializer = BesoinSerializer
DemandeUpdateSerializer = BesoinUpdateSerializer
DemandeCreateSerializer = BesoinCreateSerializer
ServiceTransactionSerializer = TransactionServiceSerializer
