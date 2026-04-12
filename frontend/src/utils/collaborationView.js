/**
 * Transforme une transaction API (liste / détail) en objet utilisé par MesCollaborations.
 * @param {object} tx — payload serializer TransactionService
 * @param {'client'|'fournisseur'} role
 */
export function transactionToCollaboration(tx, role) {
  const start = tx.heure_debut || tx.created_at;
  const end = tx.heure_fin || tx.updated_at || tx.created_at;

  const titre =
    role === 'client'
      ? tx.besoin_intitule || tx.prestation_intitule || `Transaction #${tx.id}`
      : tx.prestation_intitule || tx.besoin_intitule || `Transaction #${tx.id}`;

  const partenaire =
    role === 'client'
      ? {
          nom: tx.fournisseur_nom || 'Fournisseur',
          email: '',
          telephone: '',
          photo: null,
          note_moyenne: null,
        }
      : {
          nom: tx.client_nom || 'Client',
          email: '',
          telephone: '',
          photo: null,
          note_moyenne: null,
        };

  const categorieNom =
    role === 'client'
      ? tx.prestation_intitule
        ? 'Prestation associée'
        : 'Besoin'
      : tx.besoin_intitule
        ? 'Besoin client'
        : 'Prestation';

  return {
    id: tx.id,
    raw: tx,
    titre,
    fournisseur: partenaire,
    categorie: { id: null, nom: categorieNom },
    type: 'transaction',
    statut: tx.statut,
    date_debut: start,
    date_fin: end,
    budget: tx.prix_final != null && tx.prix_final !== '' ? Number(tx.prix_final) : null,
    description: (tx.notes && String(tx.notes).trim()) || 'Aucune note sur cette transaction.',
    review: null,
    created_at: tx.created_at,
  };
}
