"""Endpoints de configuration du pays actif."""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from transport_platform.country import (
    available_countries,
    load_country,
    resolve_country_code,
)


@api_view(["GET"])
@permission_classes([AllowAny])
def country_config(request):
    """Config complète du pays actuellement actif."""
    code = resolve_country_code()
    # On charge explicitement par code : le cache est indexé par code, donc un
    # changement de pays actif renvoie toujours la bonne config sans redémarrage.
    data = load_country(code)
    return Response(
        {
            "code": code,
            "country": data,
        }
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def countries_list(request):
    """Liste des pays disponibles + code du pays actif."""
    return Response(
        {
            "active": resolve_country_code(),
            "countries": available_countries(),
        }
    )
