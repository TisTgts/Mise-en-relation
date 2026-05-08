from django.conf import settings
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


class MatchingRun(models.Model):
    """Une ligne par exécution du matching : métadonnées + tableau JSON des correspondances."""

    lance_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="matching_runs_lances",
        verbose_name="Lancé par",
    )
    lance_le = models.DateTimeField(auto_now_add=True, verbose_name="Date d'exécution")
    correspondances = models.JSONField(default=list, verbose_name="Correspondances")

    class Meta:
        ordering = ["-lance_le"]
        verbose_name = "Exécution de matching"
        verbose_name_plural = "Exécutions de matching"

    def __str__(self):
        return f"Matching #{self.pk} — {self.lance_le:%Y-%m-%d %H:%M} ({len(self.correspondances or [])} correspondances)"
