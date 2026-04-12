from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class CategorieService(models.Model):
    """Catégorie de services"""
    nom = models.CharField(max_length=100, verbose_name="Nom de la catégorie")
    description = models.TextField(blank=True, verbose_name="Description")
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, verbose_name="Catégorie parente")
    est_active = models.BooleanField(default=True, verbose_name="Active")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Catégorie de service"
        verbose_name_plural = "Catégories de services"
        ordering = ['nom']
    
    def __str__(self):
        return self.nom

# Alias pour compatibilité
ServiceCategory = CategorieService

class Prestation(models.Model):
    """Prestation de service proposée par un prestataire"""
    
    STATUT_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('en_cours', 'En cours'),
        ('terminee', 'Terminée'),
        ('annulee', 'Annulée'),
    ]
    
    MODE_TARIFICATION_CHOICES = [
        ('fixe', 'Tarif fixe'),
        ('horaire', 'Tarif horaire'),
        ('forfait', 'Forfait'),
        ('devis', 'Sur devis'),
    ]
    
    prestataire = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='prestations',
        verbose_name="Prestataire"
    )
    categorie = models.ForeignKey(
        CategorieService, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='prestations',
        verbose_name="Catégorie"
    )
    intitule = models.CharField(max_length=200, verbose_name="Intitulé de la prestation")
    description = models.TextField(verbose_name="Description détaillée")
    type_prestation = models.CharField(max_length=100, verbose_name="Type de prestation")
    caracteristiques = models.JSONField(default=dict, verbose_name="Caractéristiques techniques")
    zones_intervention = models.JSONField(default=list, verbose_name="Zones d'intervention")
    disponibilite_debut = models.DateTimeField(verbose_name="Début de disponibilité", null=True, blank=True)
    disponibilite_fin = models.DateTimeField(verbose_name="Fin de disponibilité", null=True, blank=True)
    mode_tarification = models.CharField(
        max_length=50, 
        choices=MODE_TARIFICATION_CHOICES,
        default='fixe',
        verbose_name="Mode de tarification"
    )
    tarif_min = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        verbose_name="Tarif minimum"
    )
    tarif_max = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        verbose_name="Tarif maximum"
    )
    statut = models.CharField(
        max_length=20, 
        choices=STATUT_CHOICES, 
        default='active',
        verbose_name="Statut"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Prestation de service"
        verbose_name_plural = "Prestations de services"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.intitule} - {self.prestataire.username}"
    
    # Propriétés pour compatibilité
    @property
    def title(self):
        return self.intitule
    
    @property
    def provider(self):
        return self.prestataire
    
    @property
    def category(self):
        return self.categorie
    
    @property
    def service_type(self):
        return self.type_prestation
    
    @property
    def specifications(self):
        return self.caracteristiques
    
    @property
    def service_areas(self):
        return self.zones_intervention
    
    @property
    def availability_start(self):
        return self.disponibilite_debut
    
    @property
    def availability_end(self):
        return self.disponibilite_fin
    
    @property
    def pricing_model(self):
        return self.mode_tarification
    
    @property
    def price_range_min(self):
        return self.tarif_min
    
    @property
    def price_range_max(self):
        return self.tarif_max
    
    @property
    def status(self):
        return self.statut

# Alias pour compatibilité
ServiceOffer = Prestation

class Demande(models.Model):
    """Demande de service émise par un fournisseur"""
    
    URGENCE_CHOICES = [
        ('basse', 'Basse'),
        ('normale', 'Normale'),
        ('haute', 'Haute'),
        ('urgente', 'Urgente'),
    ]
    
    STATUT_CHOICES = [
        ('ouverte', 'Ouverte'),
        ('en_cours', 'En cours'),
        ('pourvue', 'Pourvue'),
        ('annulee', 'Annulée'),
    ]
    
    fournisseur = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='demandes',
        verbose_name="Fournisseur"
    )
    categorie = models.ForeignKey(
        CategorieService, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='demandes',
        verbose_name="Catégorie"
    )
    intitule = models.CharField(max_length=200, verbose_name="Intitulé de la demande")
    description = models.TextField(verbose_name="Description du besoin")
    type_service = models.CharField(max_length=100, verbose_name="Type de service recherché")
    exigences = models.JSONField(default=dict, verbose_name="Exigences spécifiques")
    lieu_intervention = models.CharField(max_length=200, verbose_name="Lieu d'intervention")
    date_souhaitee = models.DateTimeField(verbose_name="Date souhaitée", null=True, blank=True)
    date_limite = models.DateTimeField(verbose_name="Date limite", null=True, blank=True)
    urgence = models.CharField(
        max_length=20, 
        choices=URGENCE_CHOICES,
        default='normale',
        verbose_name="Niveau d'urgence"
    )
    budget = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Budget"
    )
    flexible = models.BooleanField(default=False, verbose_name="Flexible")
    statut = models.CharField(
        max_length=20, 
        choices=STATUT_CHOICES, 
        default='ouverte',
        verbose_name="Statut"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Demande de service"
        verbose_name_plural = "Demandes de services"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.intitule} - {self.fournisseur.username}"
    
    # Propriétés pour compatibilité
    @property
    def title(self):
        return self.intitule
    
    @property
    def client(self):
        return self.fournisseur
    
    @property
    def category(self):
        return self.categorie
    
    @property
    def service_type(self):
        return self.type_service
    
    @property
    def requirements(self):
        return self.exigences
    
    @property
    def service_location(self):
        return self.lieu_intervention
    
    @property
    def preferred_date(self):
        return self.date_souhaitee
    
    @property
    def deadline(self):
        return self.date_limite
    
    @property
    def is_flexible(self):
        return self.flexible
    
    @property
    def status(self):
        return self.statut

# Alias pour compatibilité
ServiceNeed = Demande

class TransactionService(models.Model):
    """Transaction entre une prestation et une demande"""
    
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('acceptee', 'Acceptée'),
        ('en_cours', 'En cours'),
        ('terminee', 'Terminée'),
        ('annulee', 'Annulée'),
    ]
    
    prestation = models.ForeignKey(
        Prestation, 
        on_delete=models.CASCADE, 
        related_name='transactions',
        verbose_name="Prestation"
    )
    demande = models.ForeignKey(
        Demande, 
        on_delete=models.CASCADE, 
        related_name='transactions',
        verbose_name="Demande"
    )
    prestataire = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='prestataire_transactions',
        verbose_name="Prestataire"
    )
    fournisseur = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='fournisseur_transactions',
        verbose_name="Fournisseur"
    )
    prix_final = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Prix final"
    )
    statut = models.CharField(
        max_length=20, 
        choices=STATUT_CHOICES, 
        default='en_attente',
        verbose_name="Statut"
    )
    debut_confirme = models.BooleanField(default=False, verbose_name="Début confirmé")
    fin_confirmee = models.BooleanField(default=False, verbose_name="Fin confirmée")
    heure_debut = models.DateTimeField(null=True, blank=True, verbose_name="Heure de début")
    heure_fin = models.DateTimeField(null=True, blank=True, verbose_name="Heure de fin")
    notes = models.TextField(blank=True, verbose_name="Notes")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Transaction de service"
        verbose_name_plural = "Transactions de services"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Transaction {self.id} - {self.statut}"
    
    # Propriétés pour compatibilité
    @property
    def offer(self):
        return self.prestation
    
    @property
    def need(self):
        return self.demande
    
    @property
    def provider(self):
        return self.prestataire
    
    @property
    def client(self):
        return self.fournisseur
    
    @property
    def final_price(self):
        return self.prix_final
    
    @property
    def status(self):
        return self.statut
    
    @property
    def start_confirmed(self):
        return self.debut_confirme
    
    @property
    def completion_confirmed(self):
        return self.fin_confirmee
    
    @property
    def start_time(self):
        return self.heure_debut
    
    @property
    def completion_time(self):
        return self.heure_fin

# Alias pour compatibilité
ServiceTransaction = TransactionService

class Message(models.Model):
    """Message entre utilisateurs"""
    
    expediteur = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='messages_envoyes',
        verbose_name="Expéditeur",
        null=True,
        blank=True
    )
    destinataire = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='messages_recus',
        verbose_name="Destinataire",
        null=True,
        blank=True
    )
    transaction = models.ForeignKey(
        TransactionService, 
        on_delete=models.CASCADE, 
        related_name='messages',
        null=True,
        blank=True,
        verbose_name="Transaction"
    )
    sujet = models.CharField(max_length=200, blank=True, verbose_name="Sujet")
    contenu = models.TextField(default="", verbose_name="Contenu")
    lu = models.BooleanField(default=False, verbose_name="Lu")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Message"
        verbose_name_plural = "Messages"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Message de {self.expediteur.username} à {self.destinataire.username}"
    
    # Propriétés pour compatibilité
    @property
    def sender(self):
        return self.expediteur
    
    @property
    def recipient(self):
        return self.destinataire
    
    @property
    def subject(self):
        return self.sujet
    
    @property
    def content(self):
        return self.contenu
    
    @property
    def is_read(self):
        return self.lu
