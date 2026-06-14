from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, ProfileClient, ProfileFournisseur

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'type_utilisateur', 'est_verifie', 'created_at']
    list_filter = ['type_utilisateur', 'est_verifie', 'is_staff', 'is_active']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Informations supplémentaires', {
            'fields': ('type_utilisateur', 'telephone', 'photo_profil', 'est_verifie')
        }),
    )

@admin.register(ProfileFournisseur)
class ProfileFournisseurAdmin(admin.ModelAdmin):
    list_display = ['user', 'raison_sociale', 'note_moyenne', 'services_effectues', 'assurance_valide']
    list_filter = ['assurance_valide', 'annees_experience']
    search_fields = ['user__username', 'raison_sociale']

@admin.register(ProfileClient)
class ProfileClientAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'raison_sociale', 'secteur_activite', 'abonnement_type',
        'abonnement_actif', 'frequence_besoins',
    ]
    list_filter = ['abonnement_type', 'abonnement_actif', 'secteur_activite']
    search_fields = ['user__username', 'raison_sociale', 'secteur_activite']
