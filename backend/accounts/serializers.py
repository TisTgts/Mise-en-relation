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
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'telephone', 'type_utilisateur', 'photo_profil', 'est_verifie',
            'created_at'
        ]
        read_only_fields = ['id', 'username', 'type_utilisateur', 'created_at']

class ProfileFournisseurSerializer(serializers.ModelSerializer):
    """Profil détaillé du fournisseur de services (offreur)."""
    user = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = ProfileFournisseur
        fields = [
            'user', 'raison_sociale', 'types_services_offerts', 'zones_couverture',
            'annees_experience', 'certifications', 'assurance_valide',
            'note_moyenne', 'services_effectues', 'disponibilites', 'tarif_horaire',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'note_moyenne', 'services_effectues']

class ProfileClientSerializer(serializers.ModelSerializer):
    """Profil détaillé du client (demandeur de services)."""
    user = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = ProfileClient
        fields = [
            'user', 'raison_sociale', 'secteur_activite', 'taille_entreprise',
            'besoins_services', 'fournisseurs_preferes', 'plage_budget',
            'frequence_besoins', 'contact_principal', 'mode_paiement_preferes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

class ProfileFournisseurUpdateSerializer(serializers.ModelSerializer):
    """Mise à jour du profil fournisseur."""
    
    class Meta:
        model = ProfileFournisseur
        fields = [
            'raison_sociale', 'types_services_offerts', 'zones_couverture',
            'annees_experience', 'certifications', 'assurance_valide',
            'disponibilites', 'tarif_horaire'
        ]

class ProfileClientUpdateSerializer(serializers.ModelSerializer):
    """Mise à jour du profil client."""
    
    class Meta:
        model = ProfileClient
        fields = [
            'raison_sociale', 'secteur_activite', 'taille_entreprise',
            'besoins_services', 'fournisseurs_preferes', 'plage_budget',
            'frequence_besoins', 'contact_principal', 'mode_paiement_preferes'
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
