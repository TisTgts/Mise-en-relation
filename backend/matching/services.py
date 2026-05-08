from decimal import Decimal
from math import asin, cos, radians, sin, sqrt

from django.utils import timezone as dj_tz

from accounts.models import ProfileClient, ProfileFournisseur
from services.models import Besoin, Prestation
from services.taxonomy import normalize_text, overlap_strength, tokenize


class MatchingService:
    """Matching besoins ↔ prestations : filtres durs puis score pondéré."""
    HARD_MAX_DISTANCE_KM = Decimal("60")
    MIN_ACCEPTED_SCORE = Decimal("55")
    CATEGORY_DISTANCE_LIMIT_KM = {
        "transport & logistique": Decimal("120"),
        "informatique & digital": Decimal("1000"),  # majorité des cas en ligne / hybrides
        "btp & travaux": Decimal("45"),
        "maintenance & reparation": Decimal("55"),
    }
    CATEGORY_SCORE_THRESHOLDS = {
        "transport & logistique": Decimal("58"),
        "informatique & digital": Decimal("52"),
        "btp & travaux": Decimal("62"),
        "maintenance & reparation": Decimal("57"),
    }

    WEIGHTS = {
        "competence": Decimal("0.25"),
        "geographie": Decimal("0.20"),
        "disponibilite": Decimal("0.20"),
        "fiabilite": Decimal("0.15"),
        "prix": Decimal("0.10"),
        "abonnement": Decimal("0.10"),
    }

    def __init__(self):
        total_w = sum(self.WEIGHTS.values())
        if abs(total_w - Decimal("1")) > Decimal("0.0001"):
            raise ValueError(
                f"La somme des poids du matching doit valoir 1 (actuellement {total_w})."
            )

    @staticmethod
    def _normalize(value):
        return normalize_text(value)

    @classmethod
    def _normalize_zones(cls, raw):
        """Zones d'intervention : toujours une liste de chaînes."""
        if raw is None:
            return []
        if isinstance(raw, dict):
            vals = list(raw.values())
        elif isinstance(raw, (list, tuple)):
            vals = list(raw)
        else:
            vals = [raw]
        out = []
        for z in vals:
            if z is None:
                continue
            s = str(z).strip()
            if s:
                out.append(s)
        return out

    @staticmethod
    def _zone_match_score(zone_prestation, lieu_besoin):
        area = MatchingService._normalize(str(zone_prestation))
        location = MatchingService._normalize(str(lieu_besoin))
        if not area or not location:
            return Decimal("0")
        if area in location or location in area:
            return Decimal("100")
        area_tokens = {t for t in area.replace(",", " ").split() if t}
        location_tokens = {t for t in location.replace(",", " ").split() if t}
        if area_tokens & location_tokens:
            return Decimal("80")
        return Decimal("0")

    @staticmethod
    def _extract_lat_lng(emplacement):
        if not isinstance(emplacement, dict):
            return None
        lat = emplacement.get("latitude")
        lng = emplacement.get("longitude")
        if lat is None or lng is None:
            return None
        try:
            return float(lat), float(lng)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _distance_km(point_a, point_b):
        lat1, lon1 = point_a
        lat2, lon2 = point_b
        r = 6371.0
        dlat = radians(lat2 - lat1)
        dlon = radians(lon2 - lon1)
        a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
        c = 2 * asin(min(1.0, sqrt(a)))
        return r * c

    @staticmethod
    def _main_category_id(entity):
        """FK catégorie principale (résolue via sous-catégorie si besoin)."""
        sub = getattr(entity, "sous_categorie", None)
        if sub is not None:
            cid = getattr(sub, "categorie_id", None)
            if cid:
                return cid
        cat = getattr(entity, "categorie", None)
        if cat is not None:
            return cat.id
        return None

    @classmethod
    def _normalized_main_category_name(cls, entity):
        return cls._normalize(cls._category_name(entity))

    @staticmethod
    def _category_name(entity):
        cat = getattr(entity, "categorie", None)
        if cat is not None and getattr(cat, "nom", None):
            return str(cat.nom).strip()
        sub = getattr(entity, "sous_categorie", None)
        if sub is not None and getattr(sub, "categorie", None) is not None:
            parent = getattr(sub, "categorie")
            if getattr(parent, "nom", None):
                return str(parent.nom).strip()
        return ""

    @staticmethod
    def _subcategory_name(entity):
        sub = getattr(entity, "sous_categorie", None)
        if sub is not None and getattr(sub, "nom", None):
            return str(sub.nom).strip()
        return ""

    @classmethod
    def _profile_domain_tokens(cls, prestation):
        provider = getattr(prestation, "provider", None)
        profile = cls._provider_profile(provider)
        offered = getattr(profile, "types_services_offerts", []) or []
        return tokenize(offered)

    @classmethod
    def _entity_domain_tokens(cls, entity):
        cat_name = cls._category_name(entity)
        sub_name = cls._subcategory_name(entity)
        type_name = getattr(entity, "service_type", "")
        return tokenize([cat_name, sub_name, type_name])

    @classmethod
    def _domain_overlap_strength(cls, left_tokens, right_tokens):
        return overlap_strength(left_tokens, right_tokens)

    @staticmethod
    def _subcategory_id(entity):
        sub = getattr(entity, "sous_categorie", None)
        return sub.id if sub is not None else None

    @classmethod
    def _category_compatibility_level(cls, prestation, besoin):
        """
        3 = même sous-catégorie
        2 = même catégorie principale (sans même sous-catégorie)
        1 = informations catégorielles incomplètes (aucune exclusion sur ce seul critère)
        0 = catégories principales connues et différentes
        """
        ps = cls._subcategory_id(prestation)
        bs = cls._subcategory_id(besoin)
        if ps and bs and ps == bs:
            return 3

        pm = cls._main_category_id(prestation)
        bm = cls._main_category_id(besoin)
        if pm is None or bm is None:
            return 1
        if pm == bm:
            return 2
        return 0

    @staticmethod
    def _datetime_aware(dt):
        if dt is None:
            return None
        if dj_tz.is_naive(dt):
            return dj_tz.make_aware(dt, dj_tz.get_current_timezone())
        return dt

    def _types_compatible(self, prestation, besoin):
        pt = self._normalize(prestation.service_type)
        bt = self._normalize(besoin.service_type)
        if not pt or not bt:
            return True
        return pt == bt

    @staticmethod
    def _provider_profile(user):
        if user is None:
            return None
        # Lecture DB directe pour éviter les objets OneToOne mis en cache périmés.
        return ProfileFournisseur.objects.filter(user_id=user.id).first()

    @staticmethod
    def _client_profile(user):
        if user is None:
            return None
        # Lecture DB directe pour éviter les objets OneToOne mis en cache périmés.
        return ProfileClient.objects.filter(user_id=user.id).first()

    def _within_zone_perimeter(self, prestation, besoin):
        """
        Filtre dur de périmètre:
        - si coordonnées fournisseur/client disponibles: distance <= HARD_MAX_DISTANCE_KM
        - sinon fallback textuel sur zones_intervention vs lieu_intervention
        - si infos géo absentes des 2 côtés: ne pas exclure (retourne True)
        """
        fournisseur_profile = self._provider_profile(prestation.provider)
        client_profile = self._client_profile(besoin.client)

        fournisseur_coords = self._extract_lat_lng(getattr(fournisseur_profile, "emplacement", None))
        client_coords = self._extract_lat_lng(getattr(client_profile, "emplacement", None))

        if fournisseur_coords and client_coords:
            category_name = self._normalized_main_category_name(besoin) or self._normalized_main_category_name(prestation)
            max_distance = self.CATEGORY_DISTANCE_LIMIT_KM.get(category_name, self.HARD_MAX_DISTANCE_KM)
            distance = Decimal(str(self._distance_km(fournisseur_coords, client_coords)))
            return distance <= max_distance

        zones = self._normalize_zones(prestation.service_areas)
        lieu = self._normalize(besoin.service_location)
        if zones and lieu:
            return any(self._zone_match_score(area, lieu) > Decimal("0") for area in zones)

        return True

    def _score_threshold_for_pair(self, prestation, besoin):
        category_name = self._normalized_main_category_name(besoin) or self._normalized_main_category_name(prestation)
        return self.CATEGORY_SCORE_THRESHOLDS.get(category_name, self.MIN_ACCEPTED_SCORE)

    def _is_hard_match(self, prestation, besoin):
        if prestation.statut != "active":
            return False

        if not self._types_compatible(prestation, besoin):
            return False

        if self._category_compatibility_level(prestation, besoin) == 0:
            return False

        if not self._within_zone_perimeter(prestation, besoin):
            return False

        geo = self.calculate_geographie_score(prestation, besoin)
        if geo <= Decimal("0"):
            return False

        disp = self.calculate_disponibilite_score(prestation, besoin)
        if disp <= Decimal("0"):
            return False

        return True

    def calculate_competence_score(self, prestation, besoin):
        # Base structurel : catégorie/sous-catégorie/type.
        category_level = self._category_compatibility_level(prestation, besoin)
        same_type = self._normalize(prestation.service_type) == self._normalize(besoin.service_type)

        # Signal métier : domaine déclaré dans le profil fournisseur vs besoin/prestation.
        profile_tokens = self._profile_domain_tokens(prestation)
        besoin_tokens = self._entity_domain_tokens(besoin)
        prestation_tokens = self._entity_domain_tokens(prestation)
        profile_vs_need = self._domain_overlap_strength(profile_tokens, besoin_tokens)
        profile_vs_prest = self._domain_overlap_strength(profile_tokens, prestation_tokens)
        has_domain_alignment = max(profile_vs_need, profile_vs_prest)

        if category_level == 3:
            base = Decimal("100") if same_type else Decimal("85")
        elif category_level == 2:
            base = Decimal("90") if same_type else Decimal("72")
        elif category_level == 1:
            base = Decimal("78") if same_type else Decimal("58")
        else:
            return Decimal("0")

        # Ajustement final orienté "domaine d'activité".
        # - alignement fort: petit bonus
        # - alignement partiel: neutre
        # - pas d'alignement: malus significatif
        if has_domain_alignment >= Decimal("1"):
            base += Decimal("6")
        elif has_domain_alignment <= Decimal("0"):
            base -= Decimal("22")

        if profile_tokens and has_domain_alignment <= Decimal("0"):
            # Si le fournisseur a explicitement un domaine et qu'il ne correspond pas au besoin,
            # on limite fortement la compétence pour éviter les faux positifs.
            base = min(base, Decimal("45"))

        return max(Decimal("0"), min(Decimal("100"), base))

    def calculate_geographie_score(self, prestation, besoin):
        lieu = besoin.service_location or ""
        fournisseur_profile = self._provider_profile(prestation.provider)
        client_profile = self._client_profile(besoin.client)

        fournisseur_coords = self._extract_lat_lng(getattr(fournisseur_profile, "emplacement", None))
        client_coords = self._extract_lat_lng(getattr(client_profile, "emplacement", None))

        if fournisseur_coords and client_coords:
            distance = self._distance_km(fournisseur_coords, client_coords)
            if distance <= 5:
                return Decimal("100")
            if distance <= 15:
                return Decimal("88")
            if distance <= 30:
                return Decimal("72")
            if distance <= 60:
                return Decimal("50")
            return Decimal("28")

        zones = self._normalize_zones(prestation.service_areas)
        if not zones:
            if not self._normalize(lieu):
                return Decimal("35")
            return Decimal("25")

        best = Decimal("0")
        for area in zones:
            best = max(best, self._zone_match_score(area, lieu))
        return best

    def calculate_disponibilite_score(self, prestation, besoin):
        start = prestation.availability_start
        end = prestation.availability_end
        preferred = self._datetime_aware(besoin.preferred_date)
        deadline = self._datetime_aware(besoin.deadline)

        if not start or not end:
            return Decimal("52")

        start_a = self._datetime_aware(start)
        end_a = self._datetime_aware(end)
        if start_a > end_a:
            return Decimal("48")

        if preferred and end_a < preferred:
            return Decimal("0")
        if deadline and start_a > deadline:
            return Decimal("0")

        if preferred and start_a <= preferred <= end_a:
            return Decimal("100")
        if deadline and start_a <= deadline <= end_a:
            return Decimal("82")

        overlap_before_deadline = deadline is None or start_a <= deadline
        overlap_after_pref = preferred is None or end_a >= preferred
        if overlap_before_deadline and overlap_after_pref:
            return Decimal("62")

        return Decimal("55")

    def calculate_fiabilite_score(self, prestation, besoin):
        del besoin
        fournisseur = prestation.provider
        profile = self._provider_profile(fournisseur)

        rating_part = Decimal("60")
        volume_part = Decimal("20")
        verification_part = Decimal("20")

        if profile:
            rating = Decimal(str(profile.note_moyenne or 0))
            rating_part = min(Decimal("60"), (rating / Decimal("5")) * Decimal("60"))
            completed = Decimal(str(profile.services_effectues or 0))
            volume_part = min(Decimal("20"), completed * Decimal("0.5"))

        verification_part = Decimal("20") if getattr(fournisseur, "est_verifie", False) else Decimal("8")

        score = rating_part + volume_part + verification_part
        return min(Decimal("100"), max(Decimal("0"), score))

    def calculate_prix_score(self, prestation, besoin):
        budget = besoin.budget
        if budget is None:
            return Decimal("62")

        min_price = prestation.price_range_min
        max_price = prestation.price_range_max
        budget = Decimal(str(budget))

        if min_price is not None and max_price is not None:
            min_price = Decimal(str(min_price))
            max_price = Decimal(str(max_price))
            if min_price <= budget <= max_price:
                return Decimal("100")
            if budget < min_price:
                diff = min_price - budget
                ratio = diff / min_price if min_price > 0 else Decimal("1")
                return max(Decimal("22"), Decimal("100") - ratio * Decimal("78"))
            diff = budget - max_price
            ratio = diff / max_price if max_price > 0 else Decimal("1")
            return max(Decimal("38"), Decimal("100") - ratio * Decimal("52"))

        if min_price is not None:
            min_price = Decimal(str(min_price))
            if budget >= min_price:
                return Decimal("90")
            return Decimal("36")

        if max_price is not None:
            max_price = Decimal(str(max_price))
            if budget <= max_price:
                return Decimal("90")
            return Decimal("36")

        return Decimal("62")

    def calculate_abonnement_score(self, prestation, besoin):
        del besoin
        fournisseur = prestation.provider
        profile = self._provider_profile(fournisseur)
        abonnement_type = getattr(profile, "abonnement_type", "standard")
        abonnement_actif = bool(getattr(profile, "abonnement_actif", True))

        if not abonnement_actif:
            base = Decimal("45")
        elif abonnement_type == "premium":
            base = Decimal("100")
        else:
            base = Decimal("72")

        if getattr(fournisseur, "est_verifie", False):
            base = min(Decimal("100"), base + Decimal("8"))
        return base

    def calculate_overall_score(self, prestation, besoin):
        detail = {
            "competence": self.calculate_competence_score(prestation, besoin),
            "geographie": self.calculate_geographie_score(prestation, besoin),
            "disponibilite": self.calculate_disponibilite_score(prestation, besoin),
            "fiabilite": self.calculate_fiabilite_score(prestation, besoin),
            "prix": self.calculate_prix_score(prestation, besoin),
            "abonnement": self.calculate_abonnement_score(prestation, besoin),
        }

        score = sum(detail[k] * self.WEIGHTS[k] for k in self.WEIGHTS).quantize(Decimal("0.01"))

        category_level = self._category_compatibility_level(prestation, besoin)
        details_payload = {
            "weights": {k: float(self.WEIGHTS[k]) for k in self.WEIGHTS},
            "scores": {k: float(detail[k]) for k in detail},
            "meta": {
                "category_compatibility_level": category_level,
                "types_aligned": self._types_compatible(prestation, besoin),
            },
        }
        return score, details_payload

    def build_match_reasons(self, score, details, hard_match, threshold):
        reasons = []
        scores = details.get("scores", {})
        meta = details.get("meta", {})

        if not hard_match:
            reasons.append("Rejeté par les filtres durs (statut, catégorie, type, zone ou disponibilité).")
            return reasons

        if score >= Decimal("80"):
            reasons.append("Très forte correspondance globale.")
        elif score >= Decimal("65"):
            reasons.append("Bonne correspondance globale.")
        else:
            reasons.append("Correspondance possible mais à vérifier manuellement.")

        if scores.get("competence", 0) >= 85:
            reasons.append("Domaine métier très aligné avec le besoin.")
        elif scores.get("competence", 0) < 60:
            reasons.append("Alignement métier partiel.")

        if scores.get("geographie", 0) >= 80:
            reasons.append("Zone d’intervention très proche.")
        elif scores.get("geographie", 0) < 50:
            reasons.append("Couverture géographique limitée.")

        if scores.get("prix", 0) >= 80:
            reasons.append("Budget compatible avec les tarifs proposés.")
        elif scores.get("prix", 0) < 50:
            reasons.append("Écart budgétaire important.")

        if scores.get("abonnement", 0) >= 95:
            reasons.append("Fournisseur premium favorisé.")

        category_level = meta.get("category_compatibility_level", 0)
        if category_level == 3:
            reasons.append("Même sous-catégorie détectée.")
        elif category_level == 2:
            reasons.append("Même catégorie principale détectée.")

        if score >= threshold:
            reasons.append("Score au-dessus du seuil de recommandation pour cette catégorie.")
        else:
            reasons.append("Score en dessous du seuil de recommandation pour cette catégorie.")

        return reasons

    def debug_score_for_pair(self, prestation, besoin):
        hard_match = self._is_hard_match(prestation, besoin)
        score, details = self.calculate_overall_score(prestation, besoin)
        threshold = self._score_threshold_for_pair(prestation, besoin)
        accepted = bool(hard_match and score >= threshold)
        reasons = self.build_match_reasons(score, details, hard_match, threshold)
        recommendation = (
            "Recommandé: vous pouvez contacter puis confirmer."
            if accepted
            else "À vérifier: demander plus de précisions avant confirmation."
        )
        return {
            "hard_match": hard_match,
            "score": score,
            "details": details,
            "accepted": accepted,
            "threshold": threshold,
            "recommendation": recommendation,
            "reasons": reasons,
        }

    def find_matches_for_besoin(self, besoin, limit=10):
        limit = max(1, min(int(limit or 10), 50))
        qs = (
            Prestation.objects.filter(statut="active")
            .exclude(fournisseur_id=besoin.client_id)
            .select_related(
                "fournisseur",
                "fournisseur__profile_fournisseur",
                "categorie",
                "sous_categorie",
                "sous_categorie__categorie",
            )
        )

        matches = []
        for prestation in qs.iterator(chunk_size=200):
            if not self._is_hard_match(prestation, besoin):
                continue
            score, details = self.calculate_overall_score(prestation, besoin)
            threshold = self._score_threshold_for_pair(prestation, besoin)
            if score < threshold:
                continue
            matches.append(
                {
                    "prestation": prestation,
                    "score": score,
                    "details": details,
                    "threshold": threshold,
                    "reasons": self.build_match_reasons(score, details, True, threshold),
                }
            )

        matches.sort(key=lambda x: x["score"], reverse=True)
        return matches[:limit]

    def find_matches_for_prestation(self, prestation, limit=10):
        limit = max(1, min(int(limit or 10), 50))
        qs = (
            Besoin.objects.filter(statut="ouverte")
            .exclude(client_id=prestation.fournisseur_id)
            .select_related(
                "client",
                "client__profile_client",
                "categorie",
                "sous_categorie",
                "sous_categorie__categorie",
            )
        )

        matches = []
        for besoin in qs.iterator(chunk_size=200):
            if not self._is_hard_match(prestation, besoin):
                continue
            score, details = self.calculate_overall_score(prestation, besoin)
            threshold = self._score_threshold_for_pair(prestation, besoin)
            if score < threshold:
                continue
            matches.append(
                {
                    "besoin": besoin,
                    "score": score,
                    "details": details,
                    "threshold": threshold,
                    "reasons": self.build_match_reasons(score, details, True, threshold),
                }
            )

        matches.sort(key=lambda x: x["score"], reverse=True)
        return matches[:limit]
