const IMAGE_EXT = /\.(jpe?g|png|gif|webp|heic|bmp)$/i;

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

const BLOCKED_EXTENSIONS = /\.(exe|apk|bat|cmd|com|msi|scr|js|sh|php|html?|svg)$/i;

export function isImageAttachment(nameOrUrl) {
  if (!nameOrUrl) return false;
  return IMAGE_EXT.test(String(nameOrUrl).split('?')[0]);
}

export function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

/** Valide taille, extension et type MIME avant envoi. */
export function validateAttachment(file) {
  if (!file?.uri) {
    return { ok: false, error: 'Fichier invalide' };
  }

  const name = String(file.name || 'piece_jointe');
  if (BLOCKED_EXTENSIONS.test(name)) {
    return { ok: false, error: 'Type de fichier non autorisé' };
  }

  if (file.size && file.size > MAX_ATTACHMENT_BYTES) {
    return { ok: false, error: 'Taille maximum : 10 Mo' };
  }

  const mime = String(file.mimeType || '').toLowerCase();
  if (mime && !ALLOWED_MIME_TYPES.has(mime) && mime !== 'application/octet-stream') {
    return { ok: false, error: 'Type de fichier non autorisé' };
  }

  return { ok: true };
}
