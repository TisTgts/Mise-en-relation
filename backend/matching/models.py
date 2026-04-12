from django.db import models

class MatchingRule(models.Model):
    """Modèle pour les règles de matching"""
    
    RULE_TYPES = [
        ('route', 'Correspondance de route'),
        ('capacity', 'Capacité du véhicule'),
        ('availability', 'Disponibilité'),
        ('price', 'Fourchette de prix'),
    ]
    
    name = models.CharField(max_length=100)
    rule_type = models.CharField(max_length=20, choices=RULE_TYPES)
    conditions = models.JSONField()  # Conditions de la règle
    weight = models.DecimalField(max_digits=3, decimal_places=2, default=1.0)  # Poids de la règle
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

class MatchingScore(models.Model):
    """Modèle pour stocker les scores de matching"""
    
    offer = models.ForeignKey(
        'services.Prestation', 
        on_delete=models.CASCADE, 
        related_name='matching_scores'
    )
    need = models.ForeignKey(
        'services.Besoin',
        on_delete=models.CASCADE,
        related_name='matching_scores'
    )
    score = models.DecimalField(max_digits=5, decimal_places=2)
    details = models.JSONField(default=dict)  # Détails du calcul
    calculated_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['offer', 'need']
        indexes = [
            models.Index(fields=['score']),
            models.Index(fields=['calculated_at']),
        ]
    
    def __str__(self):
        return f"Score {self.score} - Prestation {self.offer.id} / Besoin {self.need.id}"
