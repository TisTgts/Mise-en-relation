from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """Modèle utilisateur personnalisé pour la plateforme de services"""
    
    TYPES_UTILISATEUR = [
        ('client', 'Client - Exprime les besoins'),
        ('fournisseur', 'Fournisseur - Offre les services'),
        ('administrateur', 'Administrateur'),
    ]
    
    type_utilisateur = models.CharField(
        max_length=20, 
        choices=TYPES_UTILISATEUR, 
        default='client',
        verbose_name="Type d'utilisateur"
    )
    telephone = models.CharField(max_length=20, blank=True, verbose_name="Téléphone")
    photo_profil = models.ImageField(
        upload_to='photos_profil/', 
        blank=True, 
        null=True,
        verbose_name="Photo de profil"
    )
    est_verifie = models.BooleanField(default=False, verbose_name="Vérifié")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Date de mise à jour")
    
    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.username} ({self.get_type_utilisateur_display()})"
    
    # Propriétés pour compatibilité
    @property
    def user_type(self):
        return self.type_utilisateur
    
    @property
    def phone(self):
        return self.telephone
    
    @property
    def profile_picture(self):
        return self.photo_profil
    
    @property
    def is_verified(self):
        return self.est_verifie

class ProfileClient(models.Model):
    """Profil détaillé pour les clients qui expriment les besoins"""
    
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='profile_client',
        verbose_name="Utilisateur"
    )
    raison_sociale = models.CharField(max_length=200, blank=True, verbose_name="Raison sociale")
    secteur_activite = models.CharField(max_length=100, blank=True, verbose_name="Secteur d'activité")
    taille_entreprise = models.CharField(max_length=50, blank=True, verbose_name="Taille de l'entreprise")
    besoins_services = models.JSONField(default=list, verbose_name="Types de services recherchés")
    fournisseurs_preferes = models.JSONField(default=list, verbose_name="Fournisseurs préférés")
    plage_budget = models.JSONField(default=dict, verbose_name="Plage de budget habituelle")
    frequence_besoins = models.CharField(max_length=50, blank=True, verbose_name="Fréquence des besoins")
    contact_principal = models.CharField(max_length=100, blank=True, verbose_name="Contact principal")
    mode_paiement_preferes = models.JSONField(default=list, verbose_name="Modes de paiement préférés")
    emplacement = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Emplacement (géolocalisation)"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Date de mise à jour")
    
    class Meta:
        verbose_name = "Profil de client"
        verbose_name_plural = "Profils de clients"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Client: {self.user.username}"
    
    # Propriétés pour compatibilité
    @property
    def company_name(self):
        return self.raison_sociale
    
    @property
    def service_needs(self):
        return self.besoins_services
    
    @property
    def preferred_providers(self):
        return self.fournisseurs_preferes
    
    @property
    def budget_range(self):
        return self.plage_budget
    
    @property
    def request_frequency(self):
        return self.frequence_besoins

class ProfileFournisseur(models.Model):
    """Profil détaillé pour les fournisseurs qui offrent les services"""
    ABONNEMENT_CHOICES = [
        ("standard", "Standard"),
        ("premium", "Premium"),
    ]

    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='profile_fournisseur',
        verbose_name="Utilisateur"
    )
    raison_sociale = models.CharField(max_length=200, blank=True, verbose_name="Raison sociale")
    types_services_offerts = models.JSONField(default=list, verbose_name="Types de services offerts")
    zones_couverture = models.JSONField(default=list, verbose_name="Zones de couverture")
    annees_experience = models.PositiveIntegerField(default=0, verbose_name="Années d'expérience")
    certifications = models.JSONField(default=list, verbose_name="Certifications et licences")
    assurance_valide = models.BooleanField(default=False, verbose_name="Assurance valide")
    note_moyenne = models.DecimalField(
        max_digits=3, 
        decimal_places=2, 
        default=0.00,
        verbose_name="Note moyenne"
    )
    services_effectues = models.PositiveIntegerField(default=0, verbose_name="Services effectués")
    disponibilites = models.JSONField(default=dict, verbose_name="Disponibilités")
    tarif_horaire = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        null=True, 
        blank=True,
        verbose_name="Tarif horaire"
    )
    emplacement = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Emplacement (géolocalisation)"
    )
    abonnement_type = models.CharField(
        max_length=20,
        choices=ABONNEMENT_CHOICES,
        default="standard",
        verbose_name="Type d'abonnement",
    )
    abonnement_actif = models.BooleanField(default=True, verbose_name="Abonnement actif")
    abonnement_debut = models.DateField(null=True, blank=True, verbose_name="Début abonnement")
    abonnement_fin = models.DateField(null=True, blank=True, verbose_name="Fin abonnement")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Date de mise à jour")
    
    class Meta:
        verbose_name = "Profil de fournisseur"
        verbose_name_plural = "Profils de fournisseurs"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Fournisseur: {self.user.username}"
    
    # Propriétés pour compatibilité
    @property
    def company_name(self):
        return self.raison_sociale
    
    @property
    def service_types(self):
        return self.types_services_offerts
    
    @property
    def service_areas(self):
        return self.zones_couverture
    
    @property
    def experience_years(self):
        return self.annees_experience
    
    @property
    def insurance_valid(self):
        return self.assurance_valide
    
    @property
    def rating(self):
        return self.note_moyenne
    
    @property
    def total_services_completed(self):
        return self.services_effectues
    
    @property
    def hourly_rate(self):
        return self.tarif_horaire
    
    @property
    def availability(self):
        return self.disponibilites

# Alias pour compatibilité
""" ServiceProfile = ProfileFournisseur
ClientProfile = ProfileClient """
