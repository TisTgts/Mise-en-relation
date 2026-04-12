"""
Peuple la base avec des données de démonstration.

Les comptes utilisateurs sont définis dans accounts/data/seed_users.json
(types = valeurs de User.TYPES_UTILISATEUR, alignés sur le cahier / PDF).

Usage:
  python manage.py seed_db              # remplit une base vide
  python manage.py seed_db --reset      # supprime db.sqlite3, migrate, puis peuple
"""
import json
from typing import DefaultDict, List, Tuple
from collections import defaultdict
from datetime import timedelta
from decimal import Decimal
from pathlib import Path

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.db import connection
from django.utils import timezone

from accounts.models import User, ProfileClient, ProfileFournisseur
from services.models import Besoin, CategorieService, Prestation, TransactionService


def _seed_users_json_path() -> Path:
    return Path(__file__).resolve().parent.parent.parent / "data" / "seed_users.json"


def _default_users_from_model() -> List[dict]:
    """Un compte de démo par type si seed_users.json est absent."""
    mapping = {
        "administrateur": ("admin", "admin@demo.local", "Super", "Admin"),
        "client": ("client_demo", "client@demo.local", "Client", "Démo"),
        "fournisseur": ("fournisseur_demo", "fournisseur@demo.local", "Fournisseur", "Démo"),
    }
    users = []
    for code, label in User.TYPES_UTILISATEUR:
        u, em, fn, ln = mapping[code]
        users.append(
            {
                "type_utilisateur": code,
                "username": u,
                "email": em,
                "first_name": fn,
                "last_name": ln,
                "_label_pdf": label,
            }
        )
    return users


def load_user_specs() -> Tuple[List[dict], str]:
    path = _seed_users_json_path()
    allowed = {code for code, _ in User.TYPES_UTILISATEUR}
    if path.exists():
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        users = [u for u in data.get("users", []) if isinstance(u, dict)]
        password = data.get("password", "demo1234")
    else:
        users = _default_users_from_model()
        password = "demo1234"
    for u in users:
        t = u.get("type_utilisateur")
        if t not in allowed:
            raise CommandError(
                f"type_utilisateur invalide {t!r} pour {u.get('username')!r}. "
                f"Valeurs autorisées : {sorted(allowed)}"
            )
        if not u.get("username") or not u.get("email"):
            raise CommandError(f"username et email obligatoires : {u!r}")
    return users, password


def _ensure_user(
    username: str,
    email: str,
    utype: str,
    first_name: str = "",
    last_name: str = "",
    *,
    password: str = "demo1234",
) -> User:
    user, _ = User.objects.get_or_create(
        username=username,
        defaults={
            "email": email,
            "type_utilisateur": utype,
            "first_name": first_name,
            "last_name": last_name,
            "is_active": True,
        },
    )
    user.set_password(password)
    user.email = email
    user.type_utilisateur = utype
    user.first_name = first_name or ""
    user.last_name = last_name or ""
    user.is_active = True
    if utype == "administrateur":
        user.is_staff = True
        user.is_superuser = True
    else:
        user.is_staff = False
        user.is_superuser = False
    user.save()
    return user


class Command(BaseCommand):
    help = (
        "Peuple la base (catégories, profils, prestations, besoins, transactions). "
        "Les utilisateurs viennent de accounts/data/seed_users.json (types du PDF / modèle)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Supprime le fichier SQLite, réapplique toutes les migrations puis insère les données.",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Peuple même si des utilisateurs existent déjà (sans --reset : risque de doublons partiels).",
        )

    def handle(self, *args, **options):
        if options["reset"]:
            self._reset_sqlite()

        if User.objects.exists() and not options["force"] and not options["reset"]:
            self.stdout.write(
                self.style.WARNING(
                    "La base contient déjà des utilisateurs. Utilisez --reset ou --force."
                )
            )
            return

        if options["force"] and not options["reset"] and User.objects.exists():
            self.stdout.write(
                self.style.WARNING(
                    "--force : poursuite du peuplement (get_or_create sur les clés naturelles)."
                )
            )

        self._seed()

    def _reset_sqlite(self):
        if settings.DATABASES["default"]["ENGINE"] != "django.db.backends.sqlite3":
            self.stderr.write("L'option --reset n'est implémentée que pour SQLite.")
            return
        db_path = Path(settings.DATABASES["default"]["NAME"])
        connection.close()
        if db_path.exists():
            try:
                db_path.unlink()
            except PermissionError:
                self.stderr.write(
                    self.style.ERROR(
                        "Impossible de supprimer db.sqlite3 (fichier utilisé). "
                        "Arrêtez le serveur Django (runserver) et les shells ouverts sur cette base, puis réessayez."
                    )
                )
                raise SystemExit(1)
            self.stdout.write(self.style.SUCCESS(f"Fichier supprimé : {db_path}"))
        call_command("migrate", interactive=False, verbosity=1)
        self.stdout.write(self.style.SUCCESS("Migrations appliquées."))

    def _seed(self):
        now = timezone.now()
        specs, password = load_user_specs()

        created: List[User] = []
        for spec in specs:
            u = _ensure_user(
                spec["username"],
                spec["email"],
                spec["type_utilisateur"],
                spec.get("first_name", ""),
                spec.get("last_name", ""),
                password=password,
            )
            created.append(u)

        by_type: DefaultDict[str, List[User]] = defaultdict(list)
        for u in created:
            by_type[u.type_utilisateur].append(u)

        admins = by_type["administrateur"]
        clients = by_type["client"]
        fournis = by_type["fournisseur"]
        if not admins:
            raise CommandError(
                "Au moins un utilisateur avec type_utilisateur « administrateur » est requis dans seed_users.json."
            )
        if not clients:
            raise CommandError(
                "Au moins un utilisateur avec type_utilisateur « client » est requis dans seed_users.json."
            )
        if not fournis:
            raise CommandError(
                "Au moins un utilisateur avec type_utilisateur « fournisseur » est requis dans seed_users.json."
            )

        admin = admins[0]
        client_a = clients[0]
        client_b = clients[1] if len(clients) > 1 else clients[0]
        fournisseur_a = fournis[0]
        fournisseur_b = fournis[1] if len(fournis) > 1 else fournis[0]

        cats_data = [
            ("Informatique & numérique", "Développement, maintenance, cybersécurité."),
            ("Bâtiment & travaux", "Rénovation, plomberie, électricité."),
            ("Logistique & transport", "Livraison, déménagement, stockage."),
            ("Services à la personne", "Ménage, garde, accompagnement."),
        ]
        categories = []
        for nom, desc in cats_data:
            c, _ = CategorieService.objects.get_or_create(
                nom=nom, defaults={"description": desc, "est_active": True}
            )
            categories.append(c)

        cat_info = categories[0]
        cat_bat = categories[1]

        ProfileFournisseur.objects.update_or_create(
            user=fournisseur_a,
            defaults={
                "raison_sociale": "Diallo Tech SARL",
                "types_services_offerts": ["web", "support"],
                "zones_couverture": ["Dakar", "Thiès"],
                "annees_experience": 8,
                "certifications": ["AWS Cloud Practitioner"],
                "assurance_valide": True,
                "note_moyenne": Decimal("4.50"),
                "services_effectues": 42,
                "disponibilites": {"lun": "9h-18h", "mar": "9h-18h"},
                "tarif_horaire": Decimal("25000.00"),
            },
        )
        if fournisseur_b.id != fournisseur_a.id:
            ProfileFournisseur.objects.update_or_create(
                user=fournisseur_b,
                defaults={
                    "raison_sociale": "Presta SARL Bâtiment",
                    "types_services_offerts": ["plomberie", "électricité"],
                    "zones_couverture": ["Dakar", "Saint-Louis"],
                    "annees_experience": 12,
                    "certifications": [],
                    "assurance_valide": True,
                    "note_moyenne": Decimal("4.20"),
                    "services_effectues": 120,
                    "disponibilites": {},
                    "tarif_horaire": Decimal("18000.00"),
                },
            )

        ProfileClient.objects.update_or_create(
            user=client_a,
            defaults={
                "raison_sociale": "Association Jàng",
                "secteur_activite": "ESS",
                "taille_entreprise": "PME",
                "besoins_services": ["site web", "maintenance"],
                "fournisseurs_preferes": [],
                "plage_budget": {"min": 200000, "max": 2000000},
                "frequence_besoins": "mensuelle",
                "contact_principal": client_a.get_full_name() or client_a.username,
                "mode_paiement_preferes": ["virement", "mobile money"],
            },
        )
        if client_b.id != client_a.id:
            ProfileClient.objects.update_or_create(
                user=client_b,
                defaults={
                    "raison_sociale": "Commerce Médina",
                    "secteur_activite": "Commerce",
                    "taille_entreprise": "TPE",
                    "besoins_services": ["rénovation"],
                    "fournisseurs_preferes": [],
                    "plage_budget": {},
                    "frequence_besoins": "ponctuelle",
                    "contact_principal": client_b.get_full_name() or client_b.username,
                    "mode_paiement_preferes": ["espèces"],
                },
            )

        prestation_web, _ = Prestation.objects.get_or_create(
            fournisseur=fournisseur_a,
            intitule="Création de site vitrine WordPress",
            defaults={
                "categorie": cat_info,
                "description": "Site jusqu'à 10 pages, formulaire contact, hébergement conseillé.",
                "type_prestation": "Développement web",
                "caracteristiques": {"cms": "WordPress", "responsive": True},
                "zones_intervention": ["Dakar", "en ligne"],
                "disponibilite_debut": now,
                "disponibilite_fin": now + timedelta(days=90),
                "mode_tarification": "forfait",
                "tarif_min": Decimal("450000.00"),
                "tarif_max": Decimal("900000.00"),
                "statut": "active",
            },
        )

        prestation_support, _ = Prestation.objects.get_or_create(
            fournisseur=fournisseur_a,
            intitule="Support informatique TPE/PME",
            defaults={
                "categorie": cat_info,
                "description": "Astreinte et interventions sur site ou à distance.",
                "type_prestation": "Maintenance",
                "caracteristiques": {},
                "zones_intervention": ["Dakar"],
                "mode_tarification": "horaire",
                "tarif_min": Decimal("15000.00"),
                "tarif_max": Decimal("25000.00"),
                "statut": "active",
            },
        )

        if fournisseur_b.id != fournisseur_a.id:
            Prestation.objects.get_or_create(
                fournisseur=fournisseur_b,
                intitule="Dépannage plomberie urgent",
                defaults={
                    "categorie": cat_bat,
                    "description": "Fuites, remplacement robinetterie, débouchage.",
                    "type_prestation": "Plomberie",
                    "caracteristiques": {},
                    "zones_intervention": ["Dakar", "Pikine"],
                    "mode_tarification": "devis",
                    "tarif_min": Decimal("25000.00"),
                    "tarif_max": Decimal("150000.00"),
                    "statut": "active",
                },
            )

        Besoin.objects.get_or_create(
            client=client_a,
            intitule="Refonte du site de l'association",
            defaults={
                "categorie": cat_info,
                "description": "Design moderne, agenda des événements, espace adhérents.",
                "type_service": "Web",
                "exigences": {"langue": "fr", "accessibilite": "RGAA simplifié"},
                "lieu_intervention": "Dakar",
                "date_souhaitee": now + timedelta(days=14),
                "date_limite": now + timedelta(days=45),
                "urgence": "normale",
                "budget": Decimal("750000.00"),
                "flexible": True,
                "statut": "ouverte",
            },
        )

        besoin_en_cours, _ = Besoin.objects.get_or_create(
            client=client_a,
            intitule="Installation baie informatique (6 postes)",
            defaults={
                "categorie": cat_info,
                "description": "Câblage, switch, Windows 11 pro.",
                "type_service": "Infrastructure",
                "exigences": {},
                "lieu_intervention": "Dakar Plateau",
                "date_souhaitee": now + timedelta(days=7),
                "date_limite": now + timedelta(days=30),
                "urgence": "haute",
                "budget": Decimal("1200000.00"),
                "flexible": False,
                "statut": "en_cours",
            },
        )

        besoin_pourvu, _ = Besoin.objects.get_or_create(
            client=client_b,
            intitule="Réparation fuite salle de bain",
            defaults={
                "categorie": cat_bat,
                "description": "Joint et siphon à remplacer.",
                "type_service": "Plomberie",
                "exigences": {},
                "lieu_intervention": "Médina, Dakar",
                "date_souhaitee": now - timedelta(days=10),
                "date_limite": now - timedelta(days=2),
                "urgence": "urgente",
                "budget": Decimal("85000.00"),
                "flexible": False,
                "statut": "pourvue",
            },
        )

        Besoin.objects.get_or_create(
            client=client_b,
            intitule="Livraison palettes vers Saint-Louis",
            defaults={
                "categorie": categories[2],
                "description": "2 palettes, environ 400 kg.",
                "type_service": "Transport",
                "exigences": {},
                "lieu_intervention": "Dakar → Saint-Louis",
                "date_souhaitee": now + timedelta(days=5),
                "date_limite": now + timedelta(days=20),
                "urgence": "basse",
                "budget": Decimal("350000.00"),
                "flexible": True,
                "statut": "ouverte",
            },
        )

        if not TransactionService.objects.filter(
            prestation=prestation_web, besoin=besoin_pourvu
        ).exists():
            TransactionService.objects.create(
                prestation=prestation_web,
                besoin=besoin_pourvu,
                fournisseur=fournisseur_a,
                client=client_b,
                prix_final=Decimal("82000.00"),
                statut="terminee",
                debut_confirme=True,
                fin_confirmee=True,
                notes="Transaction de démonstration — besoin pourvu.",
            )

        if not TransactionService.objects.filter(
            prestation=prestation_support, besoin=besoin_en_cours
        ).exists():
            TransactionService.objects.create(
                prestation=prestation_support,
                besoin=besoin_en_cours,
                fournisseur=fournisseur_a,
                client=client_a,
                prix_final=Decimal("400000.00"),
                statut="en_cours",
                debut_confirme=True,
                fin_confirmee=False,
                notes="Démo : chantier en cours.",
            )

        self.stdout.write(self.style.SUCCESS("Données de démonstration insérées."))
        self.stdout.write(f"Fichier utilisateurs : {_seed_users_json_path()}")
        self.stdout.write(f"Mot de passe : {password}")
        self.stdout.write("Types créés (modèle / PDF) :")
        for code, label in User.TYPES_UTILISATEUR:
            names = ", ".join(sorted(u.username for u in by_type[code]))
            self.stdout.write(f"  - {code} ({label}) : {names or '—'}")
        self.stdout.write(f"  - Administrateur principal : {admin.username}")
        self.stdout.write(f"  - Catégories : {CategorieService.objects.count()}")
        self.stdout.write(f"  - Prestations : {Prestation.objects.count()}")
        self.stdout.write(f"  - Besoins : {Besoin.objects.count()}")
        self.stdout.write(f"  - Transactions : {TransactionService.objects.count()}")
