"""
Peuple la base avec des donnees realistes pour le Burkina Faso,
en se concentrant sur Ouagadougou et Bobo-Dioulasso.

Usage:
  python manage.py seed_burkina_demo
  python manage.py seed_burkina_demo --reset-domain
  python manage.py seed_burkina_demo --acteurs 200
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


OUAGA_POINTS = [
    ("Ouagadougou - Koulouba", 12.3656, -1.5339),
    ("Ouagadougou - Patte d'Oie", 12.3228, -1.5337),
    ("Ouagadougou - Dassasgho", 12.3745, -1.4832),
    ("Ouagadougou - Tampouy", 12.3987, -1.5421),
    ("Ouagadougou - Pissy", 12.3239, -1.5722),
    ("Ouagadougou - Gounghin", 12.3642, -1.4998),
]

BOBO_POINTS = [
    ("Bobo-Dioulasso - Colsama", 11.1698, -4.3030),
    ("Bobo-Dioulasso - Sarfalao", 11.1649, -4.2952),
    ("Bobo-Dioulasso - Belleville", 11.1856, -4.2878),
    ("Bobo-Dioulasso - Accart-ville", 11.1775, -4.2948),
    ("Bobo-Dioulasso - Kodeni", 11.1469, -4.3220),
    ("Bobo-Dioulasso - Bindougousso", 11.2011, -4.2806),
]


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


def phone_bf():
    return f"+226 7{random.randint(0, 9)} {random.randint(10, 99)} {random.randint(10, 99)} {random.randint(10, 99)}"


def random_point_for_city(city):
    return random.choice(OUAGA_POINTS if city == "Ouagadougou" else BOBO_POINTS)


class Command(BaseCommand):
    help = "Peuple la base avec des donnees Burkina (Ouaga/Bobo) pour tests de matching."

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
        random.seed(226)
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

        self.stdout.write(self.style.SUCCESS("Jeu Burkina insere avec succes."))
        self.stdout.write(f"- Administrateurs: {len(admins)}")
        self.stdout.write(f"- Clients: {len(clients)}")
        self.stdout.write(f"- Fournisseurs: {len(fournisseurs)}")
        self.stdout.write(f"- Prestations creees: {len(prestations)}")
        self.stdout.write(f"- Besoins crees: {len(besoins)}")

    def _ensure_administrateurs(self):
        admins_data = [
            ("admin_ouaga", "admin.ouaga@demo.bf", "Admin", "Ouaga"),
            ("admin_bobo", "admin.bobo@demo.bf", "Admin", "Bobo"),
        ]
        admins = []
        for username, email, first, last in admins_data:
            user, _ = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": email,
                    "first_name": first,
                    "last_name": last,
                    "telephone": phone_bf(),
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
            user.telephone = user.telephone or phone_bf()
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
        clients_data = [
            ("client_ouaga_01", "Aissata", "Ouedraogo", "Ouagadougou", OUAGA_POINTS[0]),
            ("client_ouaga_02", "Issa", "Kone", "Ouagadougou", OUAGA_POINTS[2]),
            ("client_ouaga_03", "Mariam", "Zongo", "Ouagadougou", OUAGA_POINTS[4]),
            ("client_bobo_01", "Moussa", "Traore", "Bobo-Dioulasso", BOBO_POINTS[0]),
            ("client_bobo_02", "Aminata", "Compaore", "Bobo-Dioulasso", BOBO_POINTS[3]),
            ("client_bobo_03", "Adama", "Sanou", "Bobo-Dioulasso", BOBO_POINTS[5]),
        ]
        while len(clients_data) < target_count:
            idx = len(clients_data) + 1
            city = "Ouagadougou" if idx % 2 else "Bobo-Dioulasso"
            point = random_point_for_city(city)
            clients_data.append(
                (f"client_{idx:03d}", f"Client{idx}", "Burkina", city, point)
            )
        clients = []
        for username, first, last, city, point in clients_data[:target_count]:
            email = f"{username}@demo.bf"
            user, _ = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": email,
                    "first_name": first,
                    "last_name": last,
                    "telephone": phone_bf(),
                    "type_utilisateur": "client",
                    "is_active": True,
                },
            )
            user.email = email
            user.type_utilisateur = "client"
            user.first_name = first
            user.last_name = last
            user.telephone = user.telephone or phone_bf()
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
                    "mode_paiement_preferes": ["Mobile Money", "Virement"],
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
        providers_data = [
            ("fournisseur_ouaga_01", "Abdou", "Nikiema", "Ouagadougou", OUAGA_POINTS[1], ["Plomberie", "Electricite"]),
            ("fournisseur_ouaga_02", "Rita", "Savadogo", "Ouagadougou", OUAGA_POINTS[3], ["Nettoyage", "Fin de chantier"]),
            ("fournisseur_ouaga_03", "Yacouba", "Bationo", "Ouagadougou", OUAGA_POINTS[5], ["Developpement web", "Design"]),
            ("fournisseur_bobo_01", "Ali", "Sore", "Bobo-Dioulasso", BOBO_POINTS[1], ["Climatisation", "Electromenager"]),
            ("fournisseur_bobo_02", "Nafissatou", "Diallo", "Bobo-Dioulasso", BOBO_POINTS[2], ["Livraison", "Demenagement"]),
            ("fournisseur_bobo_03", "Omar", "Barro", "Bobo-Dioulasso", BOBO_POINTS[4], ["Gardiennage", "Surveillance"]),
        ]
        service_buckets = [
            ["Plomberie", "Electricite"],
            ["Nettoyage", "Fin de chantier"],
            ["Developpement web", "Design"],
            ["Climatisation", "Electromenager"],
            ["Livraison", "Demenagement"],
            ["Gardiennage", "Surveillance"],
            ["Marketing digital", "Informatique"],
        ]
        while len(providers_data) < target_count:
            idx = len(providers_data) + 1
            city = "Ouagadougou" if idx % 2 else "Bobo-Dioulasso"
            point = random_point_for_city(city)
            providers_data.append(
                (
                    f"fournisseur_{idx:03d}",
                    f"Fourn{idx}",
                    "Burkina",
                    city,
                    point,
                    random.choice(service_buckets),
                )
            )
        fournisseurs = []
        for username, first, last, city, point, services in providers_data[:target_count]:
            email = f"{username}@demo.bf"
            user, _ = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": email,
                    "first_name": first,
                    "last_name": last,
                    "telephone": phone_bf(),
                    "type_utilisateur": "fournisseur",
                    "est_verifie": True,
                    "is_active": True,
                },
            )
            user.email = email
            user.type_utilisateur = "fournisseur"
            user.first_name = first
            user.last_name = last
            user.telephone = user.telephone or phone_bf()
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
        for fournisseur in fournisseurs:
            profile = getattr(fournisseur, "profile_fournisseur", None)
            city = (profile.zones_couverture[0] if profile and profile.zones_couverture else "Ouagadougou")
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
            city = random.choice(["Ouagadougou", "Bobo-Dioulasso"])
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
        for client in clients:
            profile = getattr(client, "profile_client", None)
            services = profile.besoins_services if profile else []
            services = [s for s in services if s in categories and s in SUBCATEGORY_CATALOG]
            if not services:
                services = [random.choice(list(SUBCATEGORY_CATALOG.keys()))]
            if profile and isinstance(profile.emplacement, dict):
                city = profile.emplacement.get("ville", "Ouagadougou")
            else:
                city = "Ouagadougou"
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
            city = random.choice(["Ouagadougou", "Bobo-Dioulasso"])
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
                    "devis_description": "Devis de démonstration Burkina.",
                    "devis_statut": devis_statut,
                    "devis_date_proposition": devis_date_proposition,
                    "devis_date_reponse_client": devis_date_reponse,
                    "devis_propose_par": prestation.fournisseur if devis_statut != "non_requis" else None,
                    "statut": random.choice(["en_attente", "acceptee", "en_cours", "terminee"]),
                    "debut_confirme": True,
                    "fin_confirmee": False,
                    "notes": "Transaction de demonstration pour scenario Burkina.",
                },
            )
