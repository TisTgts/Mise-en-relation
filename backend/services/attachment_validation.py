"""Validation serveur des pièces jointes (messages)."""
import os

MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024

ALLOWED_EXTENSIONS = {
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif', '.bmp',
    '.pdf', '.doc', '.docx', '.txt',
}

BLOCKED_EXTENSIONS = {
    '.exe', '.apk', '.bat', '.cmd', '.com', '.msi', '.scr', '.js', '.sh',
    '.php', '.html', '.htm', '.svg', '.jar', '.dll', '.so', '.vbs', '.ps1',
}

ALLOWED_CONTENT_TYPES = {
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
    'image/bmp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/octet-stream',  # souvent renvoyé par clients mobiles
}


def validate_uploaded_attachment(value):
    """
    Retourne None si OK, sinon un message d'erreur (str).
    `value` est un UploadedFile Django.
    """
    if not value:
        return None

    name = (getattr(value, 'name', '') or '').lower()
    ext = os.path.splitext(name)[1]

    if ext in BLOCKED_EXTENSIONS:
        return 'Type de fichier non autorisé.'
    if ext and ext not in ALLOWED_EXTENSIONS:
        return 'Type de fichier non autorisé.'

    size = getattr(value, 'size', None)
    if size is not None and size > MAX_ATTACHMENT_BYTES:
        return 'Taille maximum : 10 Mo.'

    content_type = (getattr(value, 'content_type', None) or '').lower().strip()
    if content_type and content_type not in ALLOWED_CONTENT_TYPES:
        return 'Type de fichier non autorisé.'

    return None
