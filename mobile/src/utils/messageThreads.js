/** Regroupe les messages en fils de conversation (aligné web MessagesInbox). */

export function getUserId(userOrId) {
  return userOrId?.id ?? userOrId;
}

export function buildThreadKey(message, myId) {
  const exp = getUserId(message.expediteur);
  const dest = getUserId(message.destinataire);
  const partnerId = exp === myId ? dest : exp;
  const tx = getUserId(message.transaction) || 'none';
  return `${partnerId || 'unknown'}::${tx}`;
}

export function groupMessagesIntoThreads(messages, myId, txTitles = {}) {
  const map = new Map();

  for (const m of messages) {
    const key = buildThreadKey(m, myId);
    const exp = getUserId(m.expediteur);
    const dest = getUserId(m.destinataire);
    const partnerId = exp === myId ? dest : exp;
    const partnerName =
      exp === myId
        ? m.destinataire_nom || `Utilisateur #${partnerId}`
        : m.expediteur_nom || `Utilisateur #${partnerId}`;
    const txId = getUserId(m.transaction) || null;
    const unreadForMe = dest === myId && !m.lu;
    const preview = m.contenu || m.sujet || (m.piece_jointe_nom ? `📎 ${m.piece_jointe_nom}` : '');

    if (!map.has(key)) {
      map.set(key, {
        key,
        partnerId,
        partnerName,
        transactionId: txId,
        collabTitle: txId ? txTitles[txId] || null : null,
        lastMessageAt: m.created_at,
        lastPreview: preview,
        unreadCount: unreadForMe ? 1 : 0,
        messageCount: 1,
      });
    } else {
      const t = map.get(key);
      t.messageCount += 1;
      if (new Date(m.created_at).getTime() > new Date(t.lastMessageAt).getTime()) {
        t.lastMessageAt = m.created_at;
        t.lastPreview = preview;
      }
      if (unreadForMe) t.unreadCount += 1;
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
}

export function relativeMessageTime(value) {
  if (!value) return '';
  const date = new Date(value);
  const now = new Date();
  const diffSec = (now.getTime() - date.getTime()) / 1000;
  if (diffSec < 60) return "à l'instant";
  if (diffSec < 3600) return `il y a ${Math.floor(diffSec / 60)} min`;
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();
  if (isYesterday) return 'Hier';
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

export function messageTimeLabel(value) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/** Libellé de jour pour séparateurs de conversation. */
export function messageDayLabel(value) {
  if (!value) return '';
  const date = new Date(value);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) return "Aujourd'hui";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();
  if (isYesterday) return 'Hier';

  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function dayKey(value) {
  const d = new Date(value);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * Insère des séparateurs de date dans une liste de messages triée chronologiquement.
 * @returns {Array<{ type: 'day', id: string, label: string } | { type: 'message', id: string, message: object }>}
 */
export function withDaySeparators(messages) {
  const rows = [];
  let lastKey = null;
  for (const m of messages) {
    const key = dayKey(m.created_at);
    if (key !== lastKey) {
      rows.push({
        type: 'day',
        id: `day-${key}`,
        label: messageDayLabel(m.created_at),
      });
      lastKey = key;
    }
    rows.push({ type: 'message', id: String(m.id), message: m });
  }
  return rows;
}
