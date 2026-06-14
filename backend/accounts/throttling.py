"""Limitation de débit (rate limiting) pour les endpoints sensibles."""

from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """Connexion : limite par adresse IP (scope « login »)."""

    scope = "login"


class RegisterRateThrottle(AnonRateThrottle):
    """Inscription : limite par adresse IP (scope « register »)."""

    scope = "register"


class TokenRefreshRateThrottle(AnonRateThrottle):
    """Renouvellement JWT : limite par adresse IP (scope « token_refresh »)."""

    scope = "token_refresh"


class GlobalAnonRateThrottle(AnonRateThrottle):
    """Plafond global pour les requêtes anonymes (scope « anon »)."""

    scope = "anon"


class GlobalUserRateThrottle(UserRateThrottle):
    """Plafond global pour les utilisateurs authentifiés (scope « user »)."""

    scope = "user"
