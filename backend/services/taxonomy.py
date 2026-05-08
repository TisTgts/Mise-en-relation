import unicodedata
from decimal import Decimal


TOKEN_SYNONYMS = {
    "it": "informatique",
    "digital": "informatique",
    "dev": "developpement",
    "logiciel": "developpement",
    "web": "developpement",
    "btp": "travaux",
    "batiment": "travaux",
    "travaux-publics": "travaux",
    "repair": "reparation",
    "reparation": "maintenance",
    "depannage": "maintenance",
    "livraisons": "livraison",
    "logistique": "transport",
}

BESOIN_CATEGORY_REQUIRED_FIELDS = {
    "transport & logistique": ["type_marchandise", "volume_estime"],
    "informatique & digital": ["contexte_technique", "stack_souhaitee"],
    "btp & travaux": ["surface_estimee_m2", "materiaux_fournis_par"],
    "maintenance & reparation": ["equipement_concerne", "panne_constatee"],
}


def normalize_text(value):
    if value is None:
        return ""
    text = str(value).strip().lower()
    text = unicodedata.normalize("NFD", text)
    return "".join(ch for ch in text if unicodedata.category(ch) != "Mn")


def canonical_token(token):
    norm = normalize_text(token)
    return TOKEN_SYNONYMS.get(norm, norm)


def tokenize(values):
    tokens = set()
    for value in values:
        norm = normalize_text(value)
        if not norm:
            continue
        tokens.add(canonical_token(norm))
        compact = norm.replace("/", " ").replace("-", " ").replace("_", " ").replace(",", " ")
        for part in compact.split():
            canonical = canonical_token(part)
            if canonical:
                tokens.add(canonical)
    return tokens


def overlap_strength(left_tokens, right_tokens):
    if not left_tokens or not right_tokens:
        return Decimal("0")
    direct = left_tokens & right_tokens
    if direct:
        return Decimal("1")
    for left in left_tokens:
        for right in right_tokens:
            if len(left) >= 4 and len(right) >= 4 and (left in right or right in left):
                return Decimal("0.65")
    return Decimal("0")


def required_fields_for_besoin_category(category_name):
    normalized = normalize_text(category_name)
    return BESOIN_CATEGORY_REQUIRED_FIELDS.get(normalized, [])
