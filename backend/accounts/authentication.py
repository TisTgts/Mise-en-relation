from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import TokenError


class LenientJWTAuthentication(JWTAuthentication):
    """
    Si le header Authorization contient un jeton expiré ou invalide, on ne
    renvoie pas 401 avant les permissions : la requête est traitée comme
    anonyme. Les vues ``AllowAny`` restent accessibles (ex. liste des
    catégories) même lorsque le navigateur envoie encore un ancien Bearer.
    """

    def authenticate(self, request):
        header = self.get_header(request)
        if header is None:
            return None

        raw_token = self.get_raw_token(header)
        if raw_token is None:
            return None

        try:
            validated_token = self.get_validated_token(raw_token)
        except TokenError:
            return None

        return self.get_user(validated_token), validated_token
