"""Sérialisation stable des réponses « correspondances » (API publique)."""

from decimal import Decimal


def _decimal_to_api(score):
    if isinstance(score, Decimal):
        return float(score.quantize(Decimal("0.01")))
    return round(float(score), 2)


def prestation_details_public(prestation):
    return {
        "id": prestation.id,
        "title": prestation.title,
        "provider": prestation.provider.username,
        "service_type": prestation.service_type,
        "specifications": prestation.specifications,
        "service_areas": prestation.service_areas,
        "pricing_model": prestation.pricing_model,
        "price_range_min": prestation.price_range_min,
        "price_range_max": prestation.price_range_max,
    }


def besoin_details_public(besoin):
    return {
        "id": besoin.id,
        "title": besoin.title,
        "client": besoin.client.username,
        "service_type": besoin.service_type,
        "requirements": besoin.requirements,
        "service_location": besoin.service_location,
        "budget": besoin.budget,
    }


def match_payload_from_besoin(prestation, besoin, score):
    return {
        "besoin_id": besoin.id,
        "score": _decimal_to_api(score),
        "prestation_id": prestation.id,
        "prestation_details": prestation_details_public(prestation),
        "besoin_details": besoin_details_public(besoin),
    }


def match_payload_from_prestation(prestation, besoin, score):
    return {
        "prestation_id": prestation.id,
        "besoin_id": besoin.id,
        "score": _decimal_to_api(score),
        "prestation_details": prestation_details_public(prestation),
        "besoin_details": besoin_details_public(besoin),
    }
