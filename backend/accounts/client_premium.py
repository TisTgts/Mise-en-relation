"""Droits client pour le lancement autonome du matching."""


def client_can_self_launch_matching(user) -> bool:
    if getattr(user, "type_utilisateur", None) != "client":
        return False
    from accounts.models import ProfileClient

    profile = ProfileClient.objects.filter(user_id=user.pk).first()
    if profile is None:
        return False
    return profile.can_self_launch_matching()
