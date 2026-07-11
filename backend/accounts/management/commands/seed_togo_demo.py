"""
Peuple la base avec des donnees realistes pour le pays actif (pays/*.json),
en se concentrant sur les villes principales (ex. Lome / Sokode pour le Togo).

Usage:
  python manage.py seed_togo_demo
  python manage.py seed_togo_demo --reset-domain
  python manage.py seed_togo_demo --acteurs 200
"""
from __future__ import annotations

import random
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.models import ProfileClient, ProfileFournisseur, User
from services.models import Besoin, CategorieService, SousCategorieService, Prestation, TransactionService
from transport_platform.country import get_city_names, get_country, get_primary_cities


def _build_city_points():
    """[(label, lat, lng), ...] par ville, depuis pays/*.json."""
    by_city = {}
    for city in get_country().get("cities") or []:
        name = city.get("name")
        if not name:
            continue
        lat = float(city.get("lat") or 0)
        lng = float(city.get("lng") or 0)
        quartiers = city.get("quartiers") or ["Centre"]
        by_city[name] = [
            (f"{name} - {q}", lat + (i * 0.008), lng + (i * 0.005))
            for i, q in enumerate(quartiers)
        ]
    return by_city


CITY_POINTS = _build_city_points()
CITY_NAMES = get_city_names() or list(CITY_POINTS.keys())
PRIMARY_CITY_NAMES = [c["name"] for c in get_primary_cities() if c.get("name")] or CITY_NAMES


CATEGORIES = {
    "BTP & Travaux": ["Maçonnerie", "Plomberie", "Electricite", "Peinture"],
    "Maintenance & Reparation": ["Electromenager", "Climatisation", "Informatique"],
    "Nettoyage & Entretien": ["Domicile", "Bureaux", "Fin de chantier"],
    "Transport & Logistique": ["Demenagement", "Livraison", "Coursier"],
    "Services a domicile": ["Garde d'enfants", "Aide aux seniors", "Cuisine"],
    "Informatique & Digital": ["Developpement web", "Design", "Marketing digital"],
    "Securite": ["Gardiennage", "Surveillance", "Controle d'acces"],
}

SUBCATEGORY_CATALOG = {
    "Plomberie": {"service_label": "Plomberie", "prestation_title": "Depannage plomberie", "prestation_desc": "Intervention sur fuites, robinetterie et sanitaires.", "besoin_title": "Reparation plomberie", "besoin_desc": "Besoin de plombier pour reparation rapide.", "budget_min": 20000, "budget_max": 120000},
    "Electricite": {"service_label": "Electricite", "prestation_title": "Installation electrique", "prestation_desc": "Installation et maintenance electrique domestique et pro.", "besoin_title": "Depannage electrique", "besoin_desc": "Coupure et panne electrique a resoudre.", "budget_min": 25000, "budget_max": 150000},
    "Climatisation": {"service_label": "Climatisation", "prestation_title": "Maintenance climatisation", "prestation_desc": "Pose, recharge et entretien de climatiseurs split.", "besoin_title": "Maintenance climatiseur", "besoin_desc": "Climatisation en panne ou perte de performance.", "budget_min": 30000, "budget_max": 180000},
    "Electromenager": {"service_label": "Electromenager", "prestation_title": "Reparation electromenager", "prestation_desc": "Diagnostic et reparation frigo, machine a laver, etc.", "besoin_title": "Panne electromenager", "besoin_desc": "Appareil electromenager en panne.", "budget_min": 15000, "budget_max": 100000},
    "Bureaux": {"service_label": "Nettoyage bureaux", "prestation_title": "Nettoyage de bureaux", "prestation_desc": "Entretien regulier de bureaux et locaux professionnels.", "besoin_title": "Nettoyage local professionnel", "besoin_desc": "Nettoyage de bureau/local avant exploitation.", "budget_min": 15000, "budget_max": 90000},
    "Fin de chantier": {"service_label": "Nettoyage fin de chantier", "prestation_title": "Nettoyage fin de chantier", "prestation_desc": "Nettoyage complet apres travaux et evacuation debris legers.", "besoin_title": "Nettoyage apres travaux", "besoin_desc": "Besoin de nettoyage detaille apres chantier.", "budget_min": 30000, "budget_max": 200000},
    "Livraison": {"service_label": "Livraison", "prestation_title": "Livraison urbaine", "prestation_desc": "Transport rapide de colis et documents en ville.", "besoin_title": "Livraison urgente", "besoin_desc": "Besoin de livraison rapide de colis/documents.", "budget_min": 5000, "budget_max": 50000},
    "Demenagement": {"service_label": "Demenagement", "prestation_title": "Service de demenagement", "prestation_desc": "Demenagement de domicile/bureau avec manutention.", "besoin_title": "Demenagement local", "besoin_desc": "Besoin d'equipe pour demenagement.", "budget_min": 50000, "budget_max": 350000},
    "Developpement web": {"service_label": "Developpement web", "prestation_title": "Creation site web", "prestation_desc": "Conception de site vitrine et applications web simples.", "besoin_title": "Creation site vitrine", "besoin_desc": "Besoin d'un site web pour activite locale.", "budget_min": 100000, "budget_max": 1200000},
    "Design": {"service_label": "Design", "prestation_title": "Design graphique", "prestation_desc": "Conception logo, charte visuelle et supports de communication.", "besoin_title": "Creation identite visuelle", "besoin_desc": "Besoin d'un logo et visuels pour communication.", "budget_min": 50000, "budget_max": 300000},
    "Marketing digital": {"service_label": "Marketing digital", "prestation_title": "Marketing digital local", "prestation_desc": "Gestion Facebook/WhatsApp Business et campagnes locales.", "besoin_title": "Promotion digitale", "besoin_desc": "Besoin de visibilite digitale pour activite.", "budget_min": 40000, "budget_max": 300000},
    "Gardiennage": {"service_label": "Gardiennage", "prestation_title": "Service de gardiennage", "prestation_desc": "Surveillance de commerces et habitations.", "besoin_title": "Besoin agent de securite", "besoin_desc": "Besoin d'agent de securite pour site/evenement.", "budget_min": 25000, "budget_max": 250000},
    "Surveillance": {"service_label": "Surveillance", "prestation_title": "Surveillance de site", "prestation_desc": "Mise en place de rondes et surveillance preventive.", "besoin_title": "Surveillance de site", "besoin_desc": "Besoin de surveillance continue d'un site.", "budget_min": 30000, "budget_max": 220000},
}


def phone_local():
    prefix = get_country().get("phone_prefix") or "+228"
    return f"{prefix} 9{random.randint(0, 9)} {random.randint(10, 99)} {random.randint(10, 99)} {random.randint(10, 99)}"


def random_point_for_city(city):
    points = CITY_POINTS.get(city) or next(iter(CITY_POINTS.values()), [("Centre", 0.0, 0.0)])
    return random.choice(points)


def _slug_city(name: str) -> str:
    return (
        name.lower()
        .replace("é", "e")
        .replace("è", "e")
        .replace("ô", "o")
        .replace(" ", "_")
        .replace("-", "_")
    )


class Command(BaseCommand):
    help = "Peuple la base avec des donnees du pays actif (villes principales) pour tests de matching."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset-domain",
            action="store_true",
            help="Supprime prestations, besoins, transactions et profils metier avant insertion.",
        )
        parser.add_argument(
            "--acteurs",
            type=int,
            default=12,
            help="Nombre total d'acteurs metier (clients + fournisseurs). Exemple: 200.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        country = get_country()
        random.seed(hash(country.get("code", "tg")) % 10_000)
        if options["reset_domain"]:
            self._reset_domain_data()
        total_acteurs = max(2, int(options.get("acteurs", 12)))
        nb_clients = total_acteurs // 2
        nb_fournisseurs = total_acteurs - nb_clients

        admins = self._ensure_administrateurs()
        categories = self._ensure_categories()
        clients = self._ensure_clients(nb_clients)
        fournisseurs = self._ensure_fournisseurs(nb_fournisseurs)
        prestations = self._create_prestations(fournisseurs, categories, total_acteurs)
        besoins = self._create_besoins(clients, categories, total_acteurs)
        self._create_transactions(prestations, besoins)

        self.stdout.write(
            self.style.SUCCESS(
                f"Jeu {country.get('name', country.get('code'))} insere avec succes."
            )
        )
        self.stdout.write(f"- Administrateurs: {len(admins)}")
        self.stdout.write(f"- Clients: {len(clients)}")
        self.stdout.write(f"- Fournisseurs: {len(fournisseurs)}")
        self.stdout.write(f"- Prestations creees: {len(prestations)}")
        self.stdout.write(f"- Besoins crees: {len(besoins)}")

    def _ensure_administrateurs(self):
        country = get_country()
        domain = country.get("demo_email_domain") or "demo.tg"
        cities = PRIMARY_CITY_NAMES[:2] or CITY_NAMES[:2] or ["Ville"]
        admins_data = [
            (f"admin_{_slug_city(cities[0])}", f"admin.{_slug_city(cities[0])}@{domain}", "Admin", cities[0]),
        ]
        if len(cities) > 1:
            admins_data.append(
                (f"admin_{_slug_city(cities[1])}", f"admin.{_slug_city(cities[1])}@{domain}", "Admin", cities[1])
            )
        admins = []
        for username, email, first, last in admins_data:
            user, _ = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": email,
                    "first_name": first,
                    "last_name": last,
                    "telephone": phone_local(),
                    "type_utilisateur": "administrateur",
                    "is_active": True,
                    "is_staff": True,
                    "is_superuser": True,
                },
            )
            user.email = email
            user.type_utilisateur = "administrateur"
            user.first_name = first
            user.last_name = last
            user.telephone = user.telephone or phone_local()
            user.is_active = True
            user.is_staff = True
            user.is_superuser = True
            user.set_password("demo1234")
            user.save()
            admins.append(user)
        return admins

    def _reset_domain_data(self):
        TransactionService.objects.all().delete()
        Prestation.objects.all().delete()
        Besoin.objects.all().delete()
        ProfileClient.objects.all().delete()
        ProfileFournisseur.objects.all().delete()
        self.stdout.write(self.style.WARNING("Donnees metier supprimees (reset-domain)."))

    def _ensure_categories(self):
        by_name = {}
        for parent_name, children in CATEGORIES.items():
            parent, _ = CategorieService.objects.get_or_create(
                nom=parent_name,
                defaults={"description": f"Categorie principale {parent_name}", "est_active": True},
            )
            by_name[parent_name] = parent
            for child_name in children:
                child, _ = SousCategorieService.objects.get_or_create(
                    categorie=parent,
                    nom=child_name,
                    defaults={
                        "description": f"Sous-categorie de {parent_name}",
                        "est_active": True,
                    },
                )
                if not child.est_active:
                    child.est_active = True
                    child.save(update_fields=["est_active"])
                by_name[child_name] = child
        return by_name

    def _ensure_clients(self, target_count):
        country = get_country()
        domain = country.get("demo_email_domain") or "demo.tg"
        country_name = country.get("name") or "Pays"
        payments = country.get("payment_methods") or ["Mobile Money", "Virement"]
        default_city = PRIMARY_CITY_NAMES[0] if PRIMARY_CITY_NAMES else CITY_NAMES[0]

        clients_data = []
        for i, city in enumerate(PRIMARY_CITY_NAMES[:2] or [default_city]):
            points = CITY_POINTS.get(city) or [(f"{city} - Centre", 0.0, 0.0)]
            for j in range(3):
                point = points[j % len(points)]
                clients_data.append(
                    (
                        f"client_{_slug_city(city)}_{j+1:02d}",
                        f"Client{i}{j}",
                        country_name,
                        city,
                        point,
                    )
                )
        while len(clients_data) < target_count:
            idx = len(clients_data) + 1
            city = CITY_NAMES[idx % len(CITY_NAMES)] if CITY_NAMES else default_city
            point = random_point_for_city(city)
            clients_data.append(
                (f"client_{idx:03d}", f"Client{idx}", country_name, city, point)
            )
        clients = []
        for username, first, last, city, point in clients_data[:target_count]:
            email = f"{username}@{domain}"
            user, _ = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": email,
                    "first_name": first,
                    "last_name": last,
                    "telephone": phone_local(),
                    "type_utilisateur": "client",
                    "is_active": True,
                },
            )
            user.email = email
            user.type_utilisateur = "client"
            user.first_name = first
            user.last_name = last
            user.telephone = user.telephone or phone_local()
            user.set_password("demo1234")
            user.save()

            adresse, lat, lng = point
            ProfileClient.objects.update_or_create(
                user=user,
                defaults={
                    "raison_sociale": f"{first} {last} Services",
                    "secteur_activite": random.choice(["Commerce", "Restauration", "Association", "Education"]),
                    "taille_entreprise": random.choice(["TPE", "PME"]),
                    "besoins_services": random.sample(list(SUBCATEGORY_CATALOG.keys()), k=2),
                    "fournisseurs_preferes": [],
                    "plage_budget": {"min": 25000, "max": 1200000},
                    "frequence_besoins": random.choice(["ponctuelle", "mensuelle", "trimestrielle"]),
                    "contact_principal": f"{first} {last}",
                    "mode_paiement_preferes": payments[:2],
                    "emplacement": {
                        "ville": city,
                        "adresse": adresse,
                        "latitude": lat,
                        "longitude": lng,
                    },
                },
            )
            clients.append(user)
        return clients

    def _ensure_fournisseurs(self, target_count):
        country = get_country()
        domain = country.get("demo_email_domain") or "demo.tg"
        country_name = country.get("name") or "Pays"
        default_city = PRIMARY_CITY_NAMES[0] if PRIMARY_CITY_NAMES else CITY_NAMES[0]

        providers_data = []
        service_buckets = [
            ["Plomberie", "Electricite"],
            ["Nettoyage", "Fin de chantier"],
            ["Developpement web", "Design"],
            ["Climatisation", "Electromenager"],
            ["Livraison", "Demenagement"],
            ["Gardiennage", "Surveillance"],
            ["Marketing digital", "Informatique"],
        ]
        for i, city in enumerate(PRIMARY_CITY_NAMES[:2] or [default_city]):
            points = CITY_POINTS.get(city) or [(f"{city} - Centre", 0.0, 0.0)]
            for j in range(3):
                point = points[(j + 1) % len(points)]
                providers_data.append(
                    (
                        f"fournisseur_{_slug_city(city)}_{j+1:02d}",
                        f"Fourn{i}{j}",
                        country_name,
                        city,
                        point,
                        service_buckets[j % len(service_buckets)],
                    )
                )
        while len(providers_data) < target_count:
            idx = len(providers_data) + 1
            city = CITY_NAMES[idx % len(CITY_NAMES)] if CITY_NAMES else default_city
            point = random_point_for_city(city)
            providers_data.append(
                (
                    f"fournisseur_{idx:03d}",
                    f"Fourn{idx}",
                    country_name,
                    city,
                    point,
                    random.choice(service_buckets),
                )
            )
        fournisseurs = []
        for username, first, last, city, point, services in providers_data[:target_count]:
            email = f"{username}@{domain}"
            user, _ = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": email,
                    "first_name": first,
                    "last_name": last,
                    "telephone": phone_local(),
                    "type_utilisateur": "fournisseur",
                    "est_verifie": True,
                    "is_active": True,
                },
            )
            user.email = email
            user.type_utilisateur = "fournisseur"
            user.first_name = first
            user.last_name = last
            user.telephone = user.telephone or phone_local()
            user.est_verifie = True
            user.set_password("demo1234")
            user.save()

            adresse, lat, lng = point
            ProfileFournisseur.objects.update_or_create(
                user=user,
                defaults={
                    "raison_sociale": f"{first} {last} Pro",
                    "types_services_offerts": services,
                    "zones_couverture": [city],
                    "annees_experience": random.randint(2, 12),
                    "certifications": [],
                    "assurance_valide": True,
                    "note_moyenne": Decimal(str(round(random.uniform(3.8, 4.9), 2))),
                    "services_effectues": random.randint(20, 250),
                    "disponibilites": {
                        "lun_ven": "08:00-18:00",
                        "sam": "08:00-13:00",
                    },
                    "tarif_horaire": Decimal(random.choice(["5000", "7500", "10000", "15000"])),
                    "emplacement": {
                        "ville": city,
                        "adresse": adresse,
                        "latitude": lat,
                        "longitude": lng,
                    },
                },
            )
            fournisseurs.append(user)
        return fournisseurs

    def _create_prestations(self, fournisseurs, categories, total_acteurs):
        now = timezone.now()
        templates = []
        target_count = max(6, int(total_acteurs * 1.2))
        default_city = PRIMARY_CITY_NAMES[0] if PRIMARY_CITY_NAMES else "Ville"
        for fournisseur in fournisseurs:
            profile = getattr(fournisseur, "profile_fournisseur", None)
            city = (profile.zones_couverture[0] if profile and profile.zones_couverture else default_city)
            services = profile.types_services_offerts if profile else []
            services = [s for s in services if s in categories and s in SUBCATEGORY_CATALOG]
            if not services:
                services = [random.choice(list(SUBCATEGORY_CATALOG.keys()))]
            for subcat in services[:2]:
                catalog = SUBCATEGORY_CATALOG[subcat]
                templates.append(
                    (
                        f"{catalog['prestation_title']} - {city}",
                        catalog["prestation_desc"],
                        subcat,
                        city,
                    )
                )
        while len(templates) < target_count:
            subcat = random.choice(list(SUBCATEGORY_CATALOG.keys()))
            city = random.choice(CITY_NAMES) if CITY_NAMES else default_city
            catalog = SUBCATEGORY_CATALOG[subcat]
            templates.append(
                (
                    f"{catalog['prestation_title']} #{len(templates)+1}",
                    catalog["prestation_desc"],
                    subcat,
                    city,
                )
            )
        prestations = []
        for i, (title, description, subcat, city) in enumerate(templates):
            fournisseur = fournisseurs[i % len(fournisseurs)]
            prestation, _ = Prestation.objects.get_or_create(
                fournisseur=fournisseur,
                intitule=title,
                defaults={
                    "categorie": categories[subcat].categorie,
                    "sous_categorie": categories[subcat],
                    "description": description,
                    "type_prestation": SUBCATEGORY_CATALOG[subcat]["service_label"],
                    "caracteristiques": {"zone": city},
                    "zones_intervention": [city],
                    "disponibilite_debut": now + timedelta(days=1),
                    "disponibilite_fin": now + timedelta(days=120),
                    "mode_tarification": random.choice(["horaire", "forfait", "devis"]),
                    "tarif_min": Decimal(random.choice(["20000", "30000", "50000"])),
                    "tarif_max": Decimal(random.choice(["80000", "120000", "250000"])),
                    "statut": "active",
                },
            )
            prestations.append(prestation)
        return prestations

    def _create_besoins(self, clients, categories, total_acteurs):
        now = timezone.now()
        templates = []
        target_count = max(6, int(total_acteurs * 1.1))
        default_city = PRIMARY_CITY_NAMES[0] if PRIMARY_CITY_NAMES else "Ville"
        for client in clients:
            profile = getattr(client, "profile_client", None)
            services = profile.besoins_services if profile else []
            services = [s for s in services if s in categories and s in SUBCATEGORY_CATALOG]
            if not services:
                services = [random.choice(list(SUBCATEGORY_CATALOG.keys()))]
            if profile and isinstance(profile.emplacement, dict):
                city = profile.emplacement.get("ville", default_city)
            else:
                city = default_city
            for subcat in services[:2]:
                catalog = SUBCATEGORY_CATALOG[subcat]
                templates.append(
                    (
                        f"{catalog['besoin_title']} - {city}",
                        catalog["besoin_desc"],
                        subcat,
                        city,
                    )
                )
        while len(templates) < target_count:
            subcat = random.choice(list(SUBCATEGORY_CATALOG.keys()))
            city = random.choice(CITY_NAMES) if CITY_NAMES else default_city
            catalog = SUBCATEGORY_CATALOG[subcat]
            templates.append(
                (
                    f"{catalog['besoin_title']} #{len(templates)+1}",
                    catalog["besoin_desc"],
                    subcat,
                    city,
                )
            )
        besoins = []
        for i, (title, description, subcat, city) in enumerate(templates):
            client = clients[i % len(clients)]
            mode_budget = random.choice(["budget_fixe", "sur_devis"])
            budget_value = Decimal(str(random.randint(
                SUBCATEGORY_CATALOG[subcat]["budget_min"],
                SUBCATEGORY_CATALOG[subcat]["budget_max"],
            )))
            besoin, _ = Besoin.objects.get_or_create(
                client=client,
                intitule=title,
                defaults={
                    "categorie": categories[subcat].categorie,
                    "sous_categorie": categories[subcat],
                    "description": description,
                    "type_service": SUBCATEGORY_CATALOG[subcat]["service_label"],
                    "exigences": {"ville": city},
                    "lieu_intervention": city,
                    "date_souhaitee": now + timedelta(days=random.randint(2, 12)),
                    "date_limite": now + timedelta(days=random.randint(10, 30)),
                    "urgence": random.choice(["normale", "haute", "urgente"]),
                    "mode_budget": mode_budget,
                    "budget": None if mode_budget == "sur_devis" else budget_value,
                    "flexible": random.choice([True, False]),
                    "statut": "ouverte",
                },
            )
            besoins.append(besoin)
        return besoins

    def _create_transactions(self, prestations, besoins):
        if not prestations or not besoins:
            return
        country = get_country()
        country_label = country.get("name") or country.get("code") or "pays"
        pairs = list(zip(prestations[:3], besoins[:3]))
        for prestation, besoin in pairs:
            if besoin.mode_budget == "sur_devis":
                devis_montant = Decimal("75000")
                devis_statut = random.choice(["en_attente_client", "accepte_client", "rejete_client"])
                prix_final = devis_montant if devis_statut == "accepte_client" else None
                devis_date_proposition = timezone.now() - timedelta(days=1)
                devis_date_reponse = timezone.now() if devis_statut in ["accepte_client", "rejete_client"] else None
            else:
                devis_montant = None
                devis_statut = "non_requis"
                prix_final = Decimal("75000")
                devis_date_proposition = None
                devis_date_reponse = None

            TransactionService.objects.get_or_create(
                prestation=prestation,
                besoin=besoin,
                defaults={
                    "fournisseur": prestation.fournisseur,
                    "client": besoin.client,
                    "prix_final": prix_final,
                    "devis_montant_propose": devis_montant,
                    "devis_description": f"Devis de démonstration {country_label}.",
                    "devis_statut": devis_statut,
                    "devis_date_proposition": devis_date_proposition,
                    "devis_date_reponse_client": devis_date_reponse,
                    "devis_propose_par": prestation.fournisseur if devis_statut != "non_requis" else None,
                    "statut": random.choice(["en_attente", "acceptee", "en_cours", "terminee"]),
                    "debut_confirme": True,
                    "fin_confirmee": False,
                    "notes": f"Transaction de demonstration pour scenario {country_label}.",
                },
            )
