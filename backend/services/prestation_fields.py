"""Questions posées au fournisseur selon la catégorie de sa prestation.

Remplacent les « caractéristiques » libres : les réponses sont stockées dans
Prestation.caracteristiques et affichées au client avec leur libellé.
Les types de prestation proposés sont les mêmes que les types de service des besoins
(voir besoin_fields) pour que le matching retrouve les deux côtés.
"""
from .besoin_fields import _country_context, _localize
from .taxonomy import normalize_text

EXPERIENCE = {
    "key": "experience",
    "label": "Depuis combien de temps faites-vous ce métier ?",
    "type": "select",
    "options": ["Moins d'1 an", "1 à 3 ans", "3 à 5 ans", "Plus de 5 ans"],
}

DEPLACEMENT = {
    "key": "deplacement",
    "label": "Où travaillez-vous ?",
    "type": "select",
    "options": [
        "Je me déplace chez le client",
        "Dans mon atelier / mon local",
        "Les deux",
    ],
}

GARANTIE = {
    "key": "garantie",
    "label": "Garantie sur votre travail",
    "type": "select",
    "options": ["Pas de garantie", "1 mois", "3 mois", "6 mois ou plus"],
}

PRESTATION_CATEGORY_FIELDS = {
    "transport & logistique": [
        {
            "key": "vehicules",
            "label": "Quels véhicules avez-vous ?",
            "type": "text",
            "placeholder": "Ex. 2 tricycles, 1 bâchée, 1 camion 10 tonnes",
        },
        {
            "key": "capacite_max",
            "label": "Charge maximale par voyage",
            "type": "text",
            "placeholder": "Ex. 500 kg, 10 tonnes, 1 conteneur 20 pieds",
        },
        {
            "key": "trajets",
            "label": "Trajets proposés",
            "type": "select",
            "options": [
                "En ville seulement",
                "En ville et entre villes du pays",
                "Aussi vers les pays voisins",
            ],
        },
        {
            "key": "manutention",
            "label": "Chargement / déchargement",
            "type": "select",
            "options": [
                "Inclus (j'ai des manœuvres)",
                "Possible en supplément",
                "Non, le client s'en occupe",
            ],
        },
    ],
    "informatique & digital": [
        EXPERIENCE,
        {
            "key": "realisations",
            "label": "Exemples de travaux déjà réalisés",
            "type": "text",
            "placeholder": "Ex. site d'une boutique à {ville1}, Wi-Fi d'une école, logiciel de caisse d'une pharmacie",
        },
        {
            "key": "mode_intervention",
            "label": "Comment intervenez-vous ?",
            "type": "select",
            "options": ["Sur place", "À distance", "Sur place ou à distance"],
        },
        {
            "key": "suivi",
            "label": "Suivi après la livraison",
            "type": "select",
            "options": [
                "Pas de suivi",
                "Formation à l'utilisation",
                "Suivi pendant 1 mois",
                "Contrat de maintenance possible",
            ],
        },
    ],
    "btp & travaux": [
        EXPERIENCE,
        {
            "key": "taille_equipe",
            "label": "Taille de votre équipe",
            "type": "select",
            "options": ["Je travaille seul", "2 à 5 ouvriers", "6 à 15 ouvriers", "Plus de 15 ouvriers"],
        },
        {
            "key": "materiaux",
            "label": "Pouvez-vous fournir les matériaux ?",
            "type": "select",
            "options": ["Oui", "Non, le client les achète", "Selon le chantier"],
        },
        {
            "key": "realisations",
            "label": "Chantiers déjà réalisés",
            "type": "text",
            "placeholder": "Ex. villas à {ville1}, mur de clôture, forage, installation solaire d'une école",
        },
        GARANTIE,
    ],
    "maintenance & reparation": [
        EXPERIENCE,
        {
            "key": "marques",
            "label": "Marques que vous connaissez bien",
            "type": "text",
            "placeholder": "Ex. Samsung, LG, Haier, Nasco, Perkins",
        },
        DEPLACEMENT,
        {
            "key": "pieces",
            "label": "Pièces de rechange",
            "type": "select",
            "options": ["Je les fournis", "Le client les achète", "Selon la panne"],
        },
        {
            "key": "delai",
            "label": "Délai d'intervention habituel",
            "type": "select",
            "options": ["Le jour même", "Sous 24 à 48 h", "Dans la semaine"],
        },
        GARANTIE,
    ],
}

# Catégories sans configuration dédiée.
DEFAULT_FIELDS = [EXPERIENCE, DEPLACEMENT]


def _raw_fields(category_name):
    return PRESTATION_CATEGORY_FIELDS.get(normalize_text(category_name), DEFAULT_FIELDS)


def prestation_fields_for_category(category_name):
    """Questions (exemples localisés) posées au fournisseur pour une catégorie."""
    ctx = _country_context()
    out = []
    for field in _raw_fields(category_name):
        item = dict(field)
        item.setdefault("required", False)
        for key in ("label", "placeholder", "help"):
            if key in item:
                item[key] = _localize(item[key], ctx)
        out.append(item)
    return out


def prestation_label_for_key(category_name, key):
    for field in _raw_fields(category_name):
        if field["key"] == key:
            return field["label"]
    for fields in PRESTATION_CATEGORY_FIELDS.values():
        for field in fields:
            if field["key"] == key:
                return field["label"]
    return str(key).replace("_", " ").strip().capitalize()


def format_caracteristique_value(value):
    if isinstance(value, bool):
        return "Oui" if value else "Non"
    if isinstance(value, (list, tuple)):
        return ", ".join(str(v) for v in value if v not in (None, ""))
    if isinstance(value, dict):
        return ", ".join(f"{k} : {v}" for k, v in value.items())
    return value
