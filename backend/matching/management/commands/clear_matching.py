from django.core.management.base import BaseCommand

from matching.models import MatchingRun


class Command(BaseCommand):
    help = "Supprime toutes les exécutions de matching et les correspondances stockées (table MatchingRun)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--yes",
            action="store_true",
            help="Confirmer la suppression sans invite interactive.",
        )

    def handle(self, *args, **options):
        if not options["yes"]:
            self.stderr.write(
                "Ajoutez --yes pour confirmer : python manage.py clear_matching --yes"
            )
            return

        deleted, detail = MatchingRun.objects.all().delete()
        self.stdout.write(self.style.SUCCESS(f"Supprimé : {deleted} enregistrement(s). Détail : {detail}"))
