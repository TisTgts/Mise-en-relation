"""
Crée (ou met à jour) un compte super administrateur.

Usage :
  python manage.py create_superadmin --username superadmin --email superadmin@site.bf
  python manage.py create_superadmin --username sa --email sa@site.bf --password "MotDePasse123"

Si --password est omis, le mot de passe est demandé de façon interactive.
"""
import getpass

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

User = get_user_model()


class Command(BaseCommand):
    help = "Crée ou met à jour un compte super administrateur (type_utilisateur='super_admin')."

    def add_arguments(self, parser):
        parser.add_argument("--username", required=True, help="Nom d'utilisateur (login).")
        parser.add_argument("--email", required=True, help="Adresse email.")
        parser.add_argument("--password", help="Mot de passe (sinon demandé de façon interactive).")
        parser.add_argument("--first-name", default="", help="Prénom.")
        parser.add_argument("--last-name", default="", help="Nom.")

    def handle(self, *args, **options):
        username = options["username"].strip()
        email = options["email"].strip()
        password = options.get("password")
        first_name = options.get("first_name") or ""
        last_name = options.get("last_name") or ""

        if not password:
            password = getpass.getpass("Mot de passe du super administrateur : ")
            confirm = getpass.getpass("Confirmez le mot de passe : ")
            if password != confirm:
                raise CommandError("Les mots de passe ne correspondent pas.")
        if not password:
            raise CommandError("Le mot de passe ne peut pas être vide.")

        user, created = User.objects.get_or_create(
            username=username,
            defaults={"email": email},
        )
        user.email = email
        user.type_utilisateur = "super_admin"
        user.first_name = first_name
        user.last_name = last_name
        user.is_active = True
        user.is_staff = True
        user.is_superuser = True
        user.est_verifie = True
        user.set_password(password)
        user.save()

        action = "créé" if created else "mis à jour"
        self.stdout.write(self.style.SUCCESS(
            f"Super administrateur {action} : {username} ({email})."
        ))
