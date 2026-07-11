"""Endpoint lecture seule : configuration du pays actif."""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from transport_platform.country import get_country, resolve_country_code


@api_view(["GET"])
@permission_classes([AllowAny])
def country_config(request):
    data = get_country()
    return Response(
        {
            "code": resolve_country_code(),
            "country": data,
        }
    )
