from django.core.management.base import BaseCommand

from accounts.models import User


class Command(BaseCommand):
    help = "Affiche les comptes administrateurs et leurs indicateurs de permission."

    def handle(self, *args, **options):
        admins = User.objects.filter(type_utilisateur="administrateur").order_by("username")
        total = admins.count()

        if total == 0:
            self.stdout.write(self.style.WARNING("Aucun utilisateur avec type_utilisateur='administrateur'."))
            return

        self.stdout.write(self.style.SUCCESS(f"Administrateurs trouves: {total}"))
        self.stdout.write("-" * 95)
        self.stdout.write(
            f"{'username':20} | {'email':30} | {'is_active':9} | {'is_staff':8} | {'is_superuser':12}"
        )
        self.stdout.write("-" * 95)

        for u in admins:
            self.stdout.write(
                f"{u.username:20} | {u.email[:30]:30} | {str(u.is_active):9} | {str(u.is_staff):8} | {str(u.is_superuser):12}"
            )

        invalid = admins.exclude(is_active=True, is_staff=True, is_superuser=True)
        if invalid.exists():
            self.stdout.write("")
            self.stdout.write(self.style.WARNING("Admins incomplets detectes (permissions manquantes):"))
            for u in invalid:
                self.stdout.write(
                    f"- {u.username}: active={u.is_active}, staff={u.is_staff}, superuser={u.is_superuser}"
                )
        else:
            self.stdout.write("")
            self.stdout.write(self.style.SUCCESS("Tous les admins ont les permissions attendues."))
