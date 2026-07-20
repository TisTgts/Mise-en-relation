"""Envoi de notifications Expo Push."""

from __future__ import annotations

import json
import logging
import urllib.error
import urllib.request

from .models import DevicePushToken

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'


def send_expo_push(user_id, *, title, body, data=None):
    """Envoie une notification push à tous les appareils de l'utilisateur."""
    tokens = list(
        DevicePushToken.objects.filter(user_id=user_id).values_list('token', flat=True)
    )
    if not tokens:
        return 0

    messages = [
        {
            'to': token,
            'sound': 'default',
            'title': title,
            'body': body,
            'data': data or {},
        }
        for token in tokens
        if token and token.startswith('ExponentPushToken')
    ]
    if not messages:
        return 0

    payload = json.dumps(messages).encode('utf-8')
    req = urllib.request.Request(
        EXPO_PUSH_URL,
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            resp.read()
        return len(messages)
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        logger.warning('Push Expo échoué: %s', exc)
        return 0
