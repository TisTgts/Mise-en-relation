from django.db.models import Avg, Count

from accounts.models import ProfileFournisseur
from .models import Avis


def recalculate_fournisseur_rating(fournisseur_id):
    """Recalcule note_moyenne et services_effectues du profil fournisseur."""
    stats = Avis.objects.filter(fournisseur_id=fournisseur_id).aggregate(
        avg=Avg('note'),
        total=Count('id'),
    )
    profile, _ = ProfileFournisseur.objects.get_or_create(user_id=fournisseur_id)
    profile.note_moyenne = round(stats['avg'] or 0, 2)
    profile.services_effectues = stats['total'] or 0
    profile.save(update_fields=['note_moyenne', 'services_effectues', 'updated_at'])
