from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, ProfilePrestataire, ProfileFournisseur

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

@admin.register(ProfilePrestataire)
class ProfilePrestataireAdmin(admin.ModelAdmin):
    list_display = ['user', 'raison_sociale', 'note_moyenne', 'prestations_effectuees', 'assurance_valide']
    list_filter = ['assurance_valide', 'annees_experience']
    search_fields = ['user__username', 'raison_sociale']

@admin.register(ProfileFournisseur)
class ProfileFournisseurAdmin(admin.ModelAdmin):
    list_display = ['user', 'raison_sociale', 'secteur_activite', 'frequence_services']
    search_fields = ['user__username', 'raison_sociale', 'secteur_activite']
