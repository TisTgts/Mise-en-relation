"""Logique de réinitialisation de mot de passe par code."""

from __future__ import annotations

import random
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .models import PasswordResetCode, User

CODE_TTL_MINUTES = 30


def _generate_code():
    return f'{random.randint(100000, 999999)}'


def request_password_reset(email: str):
    """
    Crée un code de reset si l'email existe.
    Ne révèle jamais si l'email est connu.
    En DEBUG, renvoie aussi le code pour faciliter les tests locaux.
    """
    email = (email or '').strip().lower()
    response = {
        'message': (
            'Si un compte existe pour cet email, un code de réinitialisation a été envoyé.'
        ),
    }

    if not email:
        return response

    user = User.objects.filter(email__iexact=email).first()
    if not user:
        return response

    code = _generate_code()
    PasswordResetCode.objects.filter(user=user, used_at__isnull=True).delete()
    PasswordResetCode.objects.create(
        user=user,
        code=code,
        expires_at=timezone.now() + timedelta(minutes=CODE_TTL_MINUTES),
    )

    subject = 'AppName — code de réinitialisation'
    body = (
        f'Bonjour,\n\n'
        f'Votre code de réinitialisation AppName est : {code}\n'
        f'Il expire dans {CODE_TTL_MINUTES} minutes.\n\n'
        f'Si vous n\'êtes pas à l\'origine de cette demande, ignorez cet email.\n'
    )
    try:
        send_mail(
            subject,
            body,
            getattr(settings, 'DEFAULT_FROM_EMAIL', None) or 'noreply@toghinis.net',
            [user.email],
            fail_silently=True,
        )
    except Exception:
        pass

    if settings.DEBUG:
        response['dev_code'] = code

    return response


def confirm_password_reset(email: str, code: str, new_password: str):
    email = (email or '').strip().lower()
    code = (code or '').strip()
    new_password = new_password or ''

    if not email or not code or len(new_password) < 8:
        return False, 'Email, code et mot de passe (8 caractères min.) sont requis.'

    user = User.objects.filter(email__iexact=email).first()
    if not user:
        return False, 'Code invalide ou expiré.'

    reset = (
        PasswordResetCode.objects.filter(
            user=user,
            code=code,
            used_at__isnull=True,
            expires_at__gte=timezone.now(),
        )
        .order_by('-created_at')
        .first()
    )
    if not reset:
        return False, 'Code invalide ou expiré.'

    user.set_password(new_password)
    user.save(update_fields=['password'])
    reset.used_at = timezone.now()
    reset.save(update_fields=['used_at'])
    PasswordResetCode.objects.filter(user=user, used_at__isnull=True).delete()
    return True, 'Mot de passe mis à jour. Vous pouvez vous connecter.'
