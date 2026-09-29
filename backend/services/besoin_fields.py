"""Questions spécifiques posées au client selon la catégorie du besoin.

Source unique pour le web et le mobile (exposée via les catégories).
Les exemples utilisent le pays actif : {ville1}, {ville2}, {mobile_money}.
"""
from .taxonomy import normalize_text

BESOIN_CATEGORY_FIELDS = {
    "transport & logistique": {
        "types_service": [
            "Livraison en ville",
            "Transport entre villes",
            "Déménagement",
            "Transport de marchandises",
            "Enlèvement au port / à la douane",
            "Location camion avec chauffeur",
        ],
        "champs": [
            {
                "key": "type_marchandise",
                "label": "Qu'est-ce qu'il faut transporter ?",
                "type": "text",
                "required": True,
                "placeholder": "Ex. sacs de ciment, vivres (maïs, riz), meubles, colis, marchandises de boutique",
            },
            {
                "key": "volume_estime",
                "label": "Quelle quantité ?",
                "type": "text",
                "required": True,
                "placeholder": "Ex. 40 sacs de 50 kg, une chambre-salon, 20 cartons, 1 conteneur 20 pieds",
                "help": "Une estimation suffit.",
            },
            {
                "key": "trajet",
                "label": "Départ et arrivée",
                "type": "text",
                "placeholder": "Ex. {ville1} (grand marché) → {ville2}",
            },
            {
                "key": "vehicule_adapte",
                "label": "Quel véhicule ?",
                "type": "select",
                "options": [
                    "Moto (petits colis)",
                    "Tricycle",
                    "Bâchée / pick-up",
                    "Camion",
                    "Gros porteur",
                    "Je ne sais pas, conseillez-moi",
                ],
            },
            {
                "key": "manutention",
                "label": "Faut-il des bras pour charger ?",
                "type": "select",
                "options": [
                    "Oui, chargement et déchargement",
                    "Chargement seulement",
                    "Non, je m'en occupe",
                ],
            },
        ],
    },
    "informatique & digital": {
        "types_service": [
            "Réparation ordinateur / imprimante",
            "Installation réseau / Wi-Fi",
            "Site internet",
            "Page Facebook / WhatsApp Business",
            "Logiciel de gestion (caisse, stock)",
            "Formation informatique",
        ],
        "champs": [
            {
                "key": "structure",
                "label": "C'est pour qui ?",
                "type": "select",
                "required": True,
                "options": [
                    "Particulier",
                    "Boutique / commerce",
                    "École / centre de formation",
                    "Clinique / pharmacie",
                    "Entreprise / PME",
                    "ONG / association",
                    "Administration",
                ],
            },
            {
                "key": "objectif",
                "label": "Qu'est-ce que vous voulez obtenir ?",
                "type": "text",
                "required": True,
                "placeholder": "Ex. réparer un ordinateur qui ne s'allume plus, créer un site pour ma boutique, installer le Wi-Fi au bureau",
            },
            {
                "key": "materiel_existant",
                "label": "Matériel déjà en place",
                "type": "text",
                "placeholder": "Ex. 3 ordinateurs, 1 imprimante, connexion box ou clé 4G",
            },
            {
                "key": "paiement_mobile",
                "label": "Paiement Mobile Money à prévoir ?",
                "type": "select",
                "options": ["Oui", "Non", "Pas concerné"],
                "help": "Ex. {mobile_money}",
            },
            {
                "key": "accompagnement",
                "label": "Suivi après l'intervention",
                "type": "select",
                "options": [
                    "Pas besoin",
                    "Formation à l'utilisation",
                    "Suivi pendant 1 mois",
                    "Contrat de maintenance",
                ],
            },
        ],
    },
    "btp & travaux": {
        "types_service": [
            "Maçonnerie / construction",
            "Plomberie",
            "Électricité bâtiment",
            "Carrelage / peinture",
            "Forage / puits",
            "Installation solaire",
            "Fosse septique / assainissement",
        ],
        "champs": [
            {
                "key": "stade_chantier",
                "label": "Où en est le chantier ?",
                "type": "select",
                "required": True,
                "options": [
                    "Terrain nu",
                    "Fondations faites",
                    "Élévation en cours",
                    "Gros œuvre terminé (finitions à faire)",
                    "Bâtiment déjà habité",
                ],
            },
            {
                "key": "materiaux_fournis_par",
                "label": "Qui achète les matériaux ?",
                "type": "select",
                "required": True,
                "options": ["Moi (le client)", "Le prestataire", "À discuter"],
            },
            {
                "key": "dimension",
                "label": "Taille des travaux",
                "type": "text",
                "placeholder": "Ex. villa 3 chambres, mur de clôture de 40 m, une salle de bain, lot de 600 m²",
            },
            {
                "key": "acces_eau_electricite",
                "label": "Eau et électricité sur place ?",
                "type": "select",
                "options": [
                    "Oui, les deux",
                    "Eau seulement",
                    "Électricité seulement",
                    "Ni l'un ni l'autre",
                ],
            },
            {
                "key": "papiers_terrain",
                "label": "Papiers du terrain / permis de construire",
                "type": "select",
                "options": ["En règle", "En cours", "Pas nécessaire / je ne sais pas"],
            },
        ],
    },
    "maintenance & reparation": {
        "types_service": [
            "Climatisation / froid",
            "Électroménager (frigo, congélateur, TV)",
            "Groupe électrogène",
            "Panneaux solaires / batteries",
            "Moto / véhicule",
            "Téléphone / tablette",
            "Contrat d'entretien",
        ],
        "champs": [
            {
                "key": "equipement_concerne",
                "label": "Quel appareil ?",
                "type": "text",
                "required": True,
                "placeholder": "Ex. climatiseur split, congélateur, groupe électrogène, kit solaire, moto",
            },
            {
                "key": "panne_constatee",
                "label": "Quel est le problème ?",
                "type": "text",
                "required": True,
                "placeholder": "Ex. ne refroidit plus, fait du bruit, ne démarre pas, la batterie se vide vite",
            },
            {
                "key": "marque_modele",
                "label": "Marque (si vous la connaissez)",
                "type": "text",
                "placeholder": "Ex. Samsung, LG, Haier, Nasco",
            },
            {
                "key": "lieu_reparation",
                "label": "Où faire la réparation ?",
                "type": "select",
                "options": [
                    "Chez moi / sur place",
                    "Je peux apporter l'appareil à l'atelier",
                    "Peu importe",
                ],
            },
            {
                "key": "frequence_intervention",
                "label": "Intervention",
                "type": "select",
                "options": [
                    "Une seule fois",
                    "Entretien tous les mois",
                    "Entretien tous les 3 mois",
                    "Entretien 2 fois par an",
                ],
            },
        ],
    },
}

# Anciennes clés encore présentes sur des besoins existants.
LEGACY_LABELS = {
    "distance_estimee_km": "Distance estimée (km)",
    "date_depart_souhaitee": "Date de départ souhaitée",
    "contexte_technique": "Contexte",
    "stack_souhaitee": "Solution souhaitée",
    "niveau_securite": "Niveau de sécurité",
    "support_requis": "Support après livraison",
    "surface_estimee_m2": "Surface estimée (m²)",
    "contraintes_site": "Contraintes du site",
    "permis_autorisation": "Permis / autorisation",
}


def _config_for(category_name):
    return BESOIN_CATEGORY_FIELDS.get(normalize_text(category_name))


def _country_context():
    try:
        from transport_platform.country import get_country, get_primary_cities

        cities = [c.get("name") for c in get_primary_cities() if c.get("name")]
        payments = get_country().get("payment_methods") or []
    except Exception:
        cities, payments = [], []
    mobile = [p for p in payments if p.lower() not in {"virement", "espèces", "especes"}]
    return {
        "ville1": cities[0] if cities else "la ville",
        "ville2": cities[1] if len(cities) > 1 else "une autre ville",
        "mobile_money": ", ".join(mobile) if mobile else "Mobile Money",
    }


def _localize(text, ctx):
    if not text:
        return text
    try:
        return text.format(**ctx)
    except (KeyError, IndexError, ValueError):
        return text


def fields_for_category(category_name):
    """Champs spécifiques (exemples localisés) pour une catégorie, [] si aucune config."""
    config = _config_for(category_name)
    if not config:
        return []
    ctx = _country_context()
    out = []
    for field in config["champs"]:
        item = {k: v for k, v in field.items()}
        item.setdefault("required", False)
        for key in ("label", "placeholder", "help"):
            if key in item:
                item[key] = _localize(item[key], ctx)
        out.append(item)
    return out


def service_types_for_category(category_name):
    config = _config_for(category_name)
    return list(config["types_service"]) if config else []


def required_fields_for_besoin_category(category_name):
    config = _config_for(category_name)
    if not config:
        return []
    return [f["key"] for f in config["champs"] if f.get("required")]


def label_for_key(category_name, key):
    config = _config_for(category_name)
    if config:
        for field in config["champs"]:
            if field["key"] == key:
                return field["label"]
    if key in LEGACY_LABELS:
        return LEGACY_LABELS[key]
    return str(key).replace("_", " ").strip().capitalize()
