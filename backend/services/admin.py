from django.contrib import admin
from .models import CategorieService, Prestation, Besoin, TransactionService, Message

@admin.register(CategorieService)
class CategorieServiceAdmin(admin.ModelAdmin):
    list_display = ['nom', 'parent', 'est_active', 'created_at']
    list_filter = ['est_active', 'created_at']
    search_fields = ['nom', 'description']
    date_hierarchy = 'created_at'
    ordering = ['nom']

@admin.register(Prestation)
class PrestationAdmin(admin.ModelAdmin):
    list_display = ['intitule', 'fournisseur', 'categorie', 'type_prestation', 'statut', 'created_at']
    list_filter = ['categorie', 'type_prestation', 'statut', 'created_at']
    search_fields = ['intitule', 'fournisseur__username', 'type_prestation']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']

@admin.register(Besoin)
class BesoinAdmin(admin.ModelAdmin):
    list_display = ['intitule', 'client', 'categorie', 'type_service', 'urgence', 'statut', 'created_at']
    list_filter = ['categorie', 'type_service', 'urgence', 'statut', 'created_at']
    search_fields = ['intitule', 'client__username', 'lieu_intervention']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']

@admin.register(TransactionService)
class TransactionServiceAdmin(admin.ModelAdmin):
    list_display = ['id', 'prestation', 'besoin', 'fournisseur', 'client', 'prix_final', 'statut', 'created_at']
    list_filter = ['statut', 'created_at']
    search_fields = ['prestation__intitule', 'besoin__intitule', 'fournisseur__username', 'client__username']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['expediteur', 'destinataire', 'sujet', 'lu', 'created_at']
    list_filter = ['lu', 'created_at']
    search_fields = ['expediteur__username', 'destinataire__username', 'sujet', 'contenu']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
