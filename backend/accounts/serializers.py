from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, ProfileClient, ProfileFournisseur

class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer pour l'inscription des utilisateurs"""
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password]
    )
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name',
            'telephone', 'type_utilisateur', 'password', 'password_confirm'
        ]
    
    def validate_type_utilisateur(self, value):
        # L'inscription publique est réservée aux clients et fournisseurs.
        # Les comptes d'administration sont créés par un super administrateur.
        if value not in ('client', 'fournisseur'):
            raise serializers.ValidationError(
                "Type de compte non autorisé à l'inscription."
            )
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError(
                "Les mots de passe ne correspondent pas"
            )
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        
        if user.type_utilisateur == 'fournisseur':
            ProfileFournisseur.objects.create(user=user)
        elif user.type_utilisateur == 'client':
            ProfileClient.objects.create(user=user)
            
        return user

class UserLoginSerializer(serializers.Serializer):
    """Serializer pour la connexion des utilisateurs"""
    email = serializers.EmailField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(
                request=self.context.get('request'),
                username=email,
                password=password
            )
            
            if not user:
                try:
                    user_obj = User.objects.get(email=email)
                    user = authenticate(
                        request=self.context.get('request'),
                        username=user_obj.username,
                        password=password
                    )
                except User.DoesNotExist:
                    user = None
            
            if not user:
                raise serializers.ValidationError(
                    'Identifiants invalides'
                )
            
            if not user.is_active:
                raise serializers.ValidationError(
                    'Ce compte est désactivé'
                )
            
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError(
                'Email et mot de passe sont requis'
            )

class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer pour le profil utilisateur"""
    matching_self_service = serializers.SerializerMethodField()
    client_abonnement_type = serializers.SerializerMethodField()
    client_abonnement_actif = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'telephone', 'type_utilisateur', 'photo_profil', 'est_verifie',
            'created_at', 'matching_self_service', 'client_abonnement_type',
            'client_abonnement_actif',
        ]
        read_only_fields = [
            'id', 'username', 'type_utilisateur', 'created_at',
            'matching_self_service', 'client_abonnement_type', 'client_abonnement_actif',
        ]

    def get_matching_self_service(self, obj):
        if obj.type_utilisateur != 'client':
            return None
        profile = getattr(obj, 'profile_client', None)
        if profile is None:
            profile = ProfileClient.objects.filter(user=obj).first()
        if profile is None:
            return False
        return profile.can_self_launch_matching()

    def get_client_abonnement_type(self, obj):
        if obj.type_utilisateur != 'client':
            return None
        profile = getattr(obj, 'profile_client', None)
        if profile is None:
            profile = ProfileClient.objects.filter(user=obj).first()
        return profile.abonnement_type if profile else 'standard'

    def get_client_abonnement_actif(self, obj):
        if obj.type_utilisateur != 'client':
            return None
        profile = getattr(obj, 'profile_client', None)
        if profile is None:
            profile = ProfileClient.objects.filter(user=obj).first()
        return bool(profile.abonnement_actif) if profile else False

class ProfileFournisseurSerializer(serializers.ModelSerializer):
    """Profil détaillé du fournisseur de services (offreur)."""
    user = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = ProfileFournisseur
        fields = [
            'user', 'raison_sociale', 'types_services_offerts', 'zones_couverture',
            'annees_experience', 'certifications', 'assurance_valide',
            'note_moyenne', 'services_effectues', 'disponibilites', 'tarif_horaire', 'emplacement',
            'abonnement_type', 'abonnement_actif', 'abonnement_debut', 'abonnement_fin',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'created_at',
            'updated_at',
            'note_moyenne',
            'services_effectues',
            'abonnement_type',
            'abonnement_actif',
            'abonnement_debut',
            'abonnement_fin',
        ]

class ProfileClientSerializer(serializers.ModelSerializer):
    """Profil détaillé du client (demandeur de services)."""
    user = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = ProfileClient
        fields = [
            'user', 'raison_sociale', 'secteur_activite', 'taille_entreprise',
            'besoins_services', 'fournisseurs_preferes', 'plage_budget',
            'frequence_besoins', 'contact_principal', 'mode_paiement_preferes', 'emplacement',
            'abonnement_type', 'abonnement_actif', 'abonnement_debut', 'abonnement_fin',
            'matching_self_service',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'created_at', 'updated_at',
            'abonnement_type', 'abonnement_actif', 'abonnement_debut', 'abonnement_fin',
            'matching_self_service',
        ]

    matching_self_service = serializers.SerializerMethodField()

    def get_matching_self_service(self, obj):
        return obj.can_self_launch_matching()

class ProfileFournisseurUpdateSerializer(serializers.ModelSerializer):
    """Mise à jour du profil fournisseur."""
    
    class Meta:
        model = ProfileFournisseur
        fields = [
            'raison_sociale', 'types_services_offerts', 'zones_couverture',
            'annees_experience', 'certifications', 'assurance_valide',
            'disponibilites', 'tarif_horaire', 'emplacement'
        ]

class ProfileClientUpdateSerializer(serializers.ModelSerializer):
    """Mise à jour du profil client."""
    
    class Meta:
        model = ProfileClient
        fields = [
            'raison_sociale', 'secteur_activite', 'taille_entreprise',
            'besoins_services', 'fournisseurs_preferes', 'plage_budget',
            'frequence_besoins', 'contact_principal', 'mode_paiement_preferes', 'emplacement'
        ]

class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour la mise à jour des informations utilisateur"""
    
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'telephone', 'photo_profil']

# Alias pour compatibilité (ancien vocabulaire « prestataire » = fournisseur de services)
ProviderProfileSerializer = ProfileFournisseurSerializer
ClientProviderProfileSerializer = ProfileClientSerializer
ProviderProfileUpdateSerializer = ProfileFournisseurUpdateSerializer
ClientProviderProfileUpdateSerializer = ProfileClientUpdateSerializer
ProfilePrestataireSerializer = ProfileFournisseurSerializer
ProfilePrestataireUpdateSerializer = ProfileFournisseurUpdateSerializer
