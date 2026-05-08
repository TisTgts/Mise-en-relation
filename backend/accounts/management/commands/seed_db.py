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
import random

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.db import connection
from django.utils import timezone

from accounts.models import User, ProfileClient, ProfileFournisseur
from services.models import Besoin, CategorieService, SousCategorieService, Prestation, TransactionService


BURKINA_CITIES = [
    {
        "city": "Ouagadougou",
        "lat": 12.3714,
        "lng": -1.5197,
        "quartiers": ["Koulouba", "Patte d'Oie", "Dassasgho", "Gounghin", "Tampouy"],
    },
    {
        "city": "Bobo-Dioulasso",
        "lat": 11.1771,
        "lng": -4.2979,
        "quartiers": ["Colsama", "Sarfalao", "Belleville", "Accart-ville", "Kodeni"],
    },
]

BURKINA_CLIENT_SECTORS = [
    "Commerce de détail",
    "Restauration",
    "Agroalimentaire",
    "Services administratifs",
    "Santé",
    "Education",
]

BURKINA_PAYMENT_MODES = ["Mobile Money", "Virement", "Espèces", "Chèque"]

BURKINA_FIRST_NAMES = [
    "Aissata",
    "Moussa",
    "Aminata",
    "Issa",
    "Mariam",
    "Adama",
    "Fatoumata",
    "Oumar",
    "Binta",
    "Abdoulaye",
]

BURKINA_LAST_NAMES = [
    "Ouedraogo",
    "Traore",
    "Compaore",
    "Savadogo",
    "Zongo",
    "Sanou",
    "Kone",
    "Nikiema",
    "Diallo",
    "Barro",
]


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
        random.seed(226)
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

        # Monter le volume d'utilisateurs pour une base réaliste Burkina.
        target_clients = 12
        target_fournisseurs = 10

        for i in range(len(clients) + 1, target_clients + 1):
            first = BURKINA_FIRST_NAMES[(i - 1) % len(BURKINA_FIRST_NAMES)]
            last = BURKINA_LAST_NAMES[(i + 2) % len(BURKINA_LAST_NAMES)]
            _ensure_user(
                username=f"client_bf_{i:02d}",
                email=f"client_bf_{i:02d}@demo.bf",
                utype="client",
                first_name=first,
                last_name=last,
                password=password,
            )
        for i in range(len(fournis) + 1, target_fournisseurs + 1):
            first = BURKINA_FIRST_NAMES[(i + 3) % len(BURKINA_FIRST_NAMES)]
            last = BURKINA_LAST_NAMES[(i + 5) % len(BURKINA_LAST_NAMES)]
            _ensure_user(
                username=f"fournisseur_bf_{i:02d}",
                email=f"fournisseur_bf_{i:02d}@demo.bf",
                utype="fournisseur",
                first_name=first,
                last_name=last,
                password=password,
            )

        # Recharger les groupes après création des comptes bulk.
        by_type = defaultdict(list)
        for u in User.objects.filter(type_utilisateur__in=["administrateur", "client", "fournisseur"]):
            by_type[u.type_utilisateur].append(u)
        clients = sorted(by_type["client"], key=lambda u: u.username)
        fournis = sorted(by_type["fournisseur"], key=lambda u: u.username)

        categories_structure = {
            "Informatique & Digital": [
                "Développement web",
                "Développement logiciel",
                "Support informatique",
                "Fourniture matériel informatique",
            ],
            "BTP & Travaux": [
                "Plomberie",
                "Électricité",
                "Maçonnerie",
            ],
            "Transport & Logistique": [
                "Livraison",
                "Déménagement",
            ],
            "Maintenance & Réparation": [
                "Climatisation",
                "Électroménager",
            ],
        }
        categories_by_name = {}
        for parent_name, children in categories_structure.items():
            parent_cat, _ = CategorieService.objects.get_or_create(
                nom=parent_name,
                defaults={"description": f"Catégorie principale: {parent_name}", "est_active": True},
            )
            categories_by_name[parent_name] = parent_cat
            for child_name in children:
                child_cat, _ = SousCategorieService.objects.get_or_create(
                    categorie=parent_cat,
                    nom=child_name,
                    defaults={
                        "description": f"Sous-catégorie de {parent_name}",
                        "est_active": True,
                    },
                )
                if not child_cat.est_active:
                    child_cat.est_active = True
                    child_cat.save(update_fields=["est_active"])
                categories_by_name[child_name] = child_cat

        def _city_payload(index):
            city = BURKINA_CITIES[index % len(BURKINA_CITIES)]
            quartier = city["quartiers"][index % len(city["quartiers"])]
            return {
                "city": city["city"],
                "lat": city["lat"],
                "lng": city["lng"],
                "adresse": f"{city['city']} - {quartier}",
                "quartier": quartier,
            }

        fournisseur_domains = [
            (
                "Informatique & Digital",
                [
                    "Développement web",
                    "Développement logiciel",
                    "Support informatique",
                    "Fourniture matériel informatique",
                    "Support informatique",
                ],
            ),
            (
                "BTP & Travaux",
                [
                    "Plomberie",
                    "Électricité",
                    "Maçonnerie",
                    "Plomberie",
                    "Électricité",
                ],
            ),
            (
                "Transport & Logistique",
                [
                    "Livraison",
                    "Déménagement",
                    "Livraison",
                    "Déménagement",
                    "Livraison",
                ],
            ),
            (
                "Maintenance & Réparation",
                [
                    "Climatisation",
                    "Électroménager",
                    "Climatisation",
                    "Électroménager",
                    "Climatisation",
                ],
            ),
        ]

        for idx, fournisseur in enumerate(fournis):
            city = _city_payload(idx)
            domain_name, offered_types = fournisseur_domains[idx % len(fournisseur_domains)]
            ProfileFournisseur.objects.update_or_create(
                user=fournisseur,
                defaults={
                    "raison_sociale": f"{(fournisseur.first_name or fournisseur.username).title()} Services SARL",
                    "types_services_offerts": offered_types,
                    "zones_couverture": ["Ouagadougou", "Bobo-Dioulasso"],
                    "annees_experience": 3 + (idx % 12),
                    "certifications": ["Certification métier"] if idx % 3 == 0 else [],
                    "assurance_valide": True,
                    "note_moyenne": Decimal("3.80") + Decimal((idx % 12) / 10),
                    "services_effectues": 10 + (idx * 7),
                    "disponibilites": {"lun-ven": "08h-18h"},
                    "tarif_horaire": Decimal("15000.00") + Decimal((idx % 6) * 2500),
                    "emplacement": {
                        "latitude": city["lat"],
                        "longitude": city["lng"],
                        "adresse": city["adresse"],
                        "ville": city["city"],
                    },
                },
            )

            # 5 prestations par fournisseur
            for j, service_type in enumerate(offered_types, start=1):
                sub = categories_by_name.get(service_type)
                if not sub:
                    continue
                mode_tarification = "forfait" if j % 2 else "devis"
                tarif_min = Decimal("50000.00") + Decimal((idx + j) * 10000)
                tarif_max = tarif_min + Decimal("250000.00")
                Prestation.objects.update_or_create(
                    fournisseur=fournisseur,
                    intitule=f"{service_type} - Offre {j:02d} - {fournisseur.username}",
                    defaults={
                        "categorie": sub.categorie,
                        "sous_categorie": sub,
                        "description": f"Prestation {service_type} proposée par {fournisseur.username}.",
                        "type_prestation": service_type,
                        "caracteristiques": {"niveau_service": "standard", "domaine": domain_name},
                        "zones_intervention": ["Ouagadougou", "Bobo-Dioulasso"],
                        "disponibilite_debut": now,
                        "disponibilite_fin": now + timedelta(days=120),
                        "mode_tarification": mode_tarification,
                        "tarif_min": tarif_min,
                        "tarif_max": tarif_max,
                        "statut": "active",
                    },
                )

        besoins_templates = [
            ("Refonte site web pour PME à Ouaga", "Développement web", Decimal("850000.00"), True),
            ("Application de gestion stock pour boutique", "Développement logiciel", Decimal("1500000.00"), False),
            ("Support informatique mensuel agence", "Support informatique", Decimal("350000.00"), True),
            ("Fourniture PC et imprimantes de bureau", "Fourniture matériel informatique", Decimal("1800000.00"), False),
            ("Réparation fuite ONEA sur installation interne", "Plomberie", Decimal("85000.00"), False),
            ("Mise aux normes électriques local commercial", "Électricité", Decimal("650000.00"), False),
            ("Rénovation mur et dalle magasin", "Maçonnerie", Decimal("500000.00"), True),
            ("Livraison urbaine de colis e-commerce", "Livraison", Decimal("250000.00"), True),
            ("Déménagement de bureau inter-quartiers", "Déménagement", Decimal("450000.00"), True),
            ("Maintenance climatisation saison chaude", "Climatisation", Decimal("300000.00"), True),
            ("Réparation congélateur boutique", "Électroménager", Decimal("220000.00"), True),
        ]
        urgence_cycle = ["basse", "normale", "haute", "urgente"]

        # 10 besoins par client
        for cidx, client in enumerate(clients):
            city = _city_payload(cidx)
            ProfileClient.objects.update_or_create(
                user=client,
                defaults={
                    "raison_sociale": f"{(client.first_name or client.username).title()} & Co",
                    "secteur_activite": BURKINA_CLIENT_SECTORS[cidx % len(BURKINA_CLIENT_SECTORS)],
                    "taille_entreprise": "PME" if cidx % 2 == 0 else "TPE",
                    "besoins_services": [tpl[1] for tpl in besoins_templates[:4]],
                    "fournisseurs_preferes": [],
                    "plage_budget": {"min": 100000, "max": 3000000},
                    "frequence_besoins": "mensuelle" if cidx % 3 else "trimestrielle",
                    "contact_principal": client.get_full_name() or client.username,
                    "mode_paiement_preferes": BURKINA_PAYMENT_MODES[:2] if cidx % 2 == 0 else BURKINA_PAYMENT_MODES[1:3],
                    "emplacement": {
                        "latitude": city["lat"],
                        "longitude": city["lng"],
                        "adresse": city["adresse"],
                        "ville": city["city"],
                    },
                },
            )

            for j in range(10):
                tpl = besoins_templates[(cidx * 3 + j) % len(besoins_templates)]
                titre_base, service_type, budget_base, flexible_default = tpl
                sub = categories_by_name.get(service_type)
                if not sub:
                    continue
                mode_budget = "sur_devis" if (j % 3 == 0) else "budget_fixe"
                statut = "ouverte"
                if j in (7, 8):
                    statut = "en_cours"
                if j == 9:
                    statut = "pourvue"
                Besoin.objects.update_or_create(
                    client=client,
                    intitule=f"{titre_base} - {client.username} - {j+1:02d}",
                    defaults={
                        "categorie": sub.categorie,
                        "sous_categorie": sub,
                        "description": f"Besoin {service_type} pour {client.username}.",
                        "type_service": service_type,
                        "exigences": {
                            "priorite_metier": "standard",
                            "index_client": cidx,
                            "index_besoin": j + 1,
                            "quartier": city["quartier"],
                        },
                        "lieu_intervention": city["adresse"],
                        "date_souhaitee": now + timedelta(days=2 + (j % 10)),
                        "date_limite": now + timedelta(days=10 + (j % 20)),
                        "urgence": urgence_cycle[(cidx + j) % len(urgence_cycle)],
                        "mode_budget": mode_budget,
                        "budget": None if mode_budget == "sur_devis" else (budget_base + Decimal((j % 4) * 50000)),
                        "flexible": flexible_default,
                        "statut": statut,
                    },
                )

        created_prestations = list(Prestation.objects.filter(statut="active").order_by("id"))

        # Transactions démo sur quelques besoins non ouverts
        besoins_non_ouverts = list(
            Besoin.objects.filter(statut__in=["en_cours", "pourvue"]).order_by("id")[:8]
        )
        for idx, besoin in enumerate(besoins_non_ouverts):
            prestation = created_prestations[idx % len(created_prestations)]
            if besoin.mode_budget == "sur_devis":
                if idx % 3 == 0:
                    devis_statut = "en_attente_client"
                elif idx % 3 == 1:
                    devis_statut = "accepte_client"
                else:
                    devis_statut = "rejete_client"
                devis_montant = prestation.tarif_min or Decimal("75000.00")
                prix_final = devis_montant if devis_statut == "accepte_client" else None
            else:
                devis_statut = "non_requis"
                devis_montant = None
                prix_final = prestation.tarif_min

            tx, created = TransactionService.objects.get_or_create(
                prestation=prestation,
                besoin=besoin,
                fournisseur=prestation.fournisseur,
                client=besoin.client,
                defaults={
                    "prix_final": prix_final,
                    "devis_montant_propose": devis_montant,
                    "devis_description": "Devis initial proposé automatiquement pour la démo.",
                    "devis_statut": devis_statut,
                    "devis_date_proposition": now if besoin.mode_budget == "sur_devis" else None,
                    "devis_date_reponse_client": now if devis_statut in ["accepte_client", "rejete_client"] else None,
                    "devis_propose_par": prestation.fournisseur if besoin.mode_budget == "sur_devis" else None,
                    "statut": "en_cours" if besoin.statut == "en_cours" else ("terminee" if devis_statut != "en_attente_client" else "acceptee"),
                    "debut_confirme": True,
                    "fin_confirmee": besoin.statut == "pourvue" and devis_statut != "en_attente_client",
                    "notes": "Transaction générée automatiquement pour dataset de démonstration.",
                },
            )
            if not created:
                tx.statut = "en_cours" if besoin.statut == "en_cours" else ("terminee" if devis_statut != "en_attente_client" else "acceptee")
                tx.debut_confirme = True
                tx.fin_confirmee = besoin.statut == "pourvue" and devis_statut != "en_attente_client"
                if besoin.mode_budget == "sur_devis":
                    tx.devis_montant_propose = tx.devis_montant_propose or devis_montant
                    tx.devis_description = tx.devis_description or "Devis initial proposé automatiquement pour la démo."
                    tx.devis_statut = devis_statut
                    tx.devis_date_proposition = tx.devis_date_proposition or now
                    if devis_statut in ["accepte_client", "rejete_client"]:
                        tx.devis_date_reponse_client = tx.devis_date_reponse_client or now
                    tx.devis_propose_par = tx.devis_propose_par or prestation.fournisseur
                    tx.prix_final = tx.devis_montant_propose if devis_statut == "accepte_client" else None
                else:
                    tx.devis_statut = "non_requis"
                    tx.prix_final = tx.prix_final or prestation.tarif_min
                tx.save(
                    update_fields=[
                        "statut", "debut_confirme", "fin_confirmee",
                        "prix_final", "devis_montant_propose", "devis_description",
                        "devis_statut", "devis_date_proposition", "devis_date_reponse_client",
                        "devis_propose_par", "updated_at"
                    ]
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
