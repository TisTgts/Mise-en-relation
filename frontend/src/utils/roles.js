// Helpers centralisés pour les rôles utilisateurs.
// Évite de disperser les comparaisons de type_utilisateur dans toute l'app.

export const ROLE_LABELS = {
  client: 'Client',
  fournisseur: 'Fournisseur',
  administrateur: 'Administrateur',
  super_admin: 'Super administrateur',
};

/** Rôles ayant accès à l'espace d'administration (admin + super admin). */
export const ADMIN_TYPES = ['administrateur', 'super_admin'];

const typeOf = (user) => user?.type_utilisateur;

export const isSuperAdmin = (user) => typeOf(user) === 'super_admin';

export const isAdministrator = (user) => typeOf(user) === 'administrateur';

/** Vrai pour un administrateur OU un super administrateur. */
export const isAdminType = (user) => ADMIN_TYPES.includes(typeOf(user));

export const roleLabel = (type) => ROLE_LABELS[type] || type;

/** Tableau de bord d'accueil selon le rôle. */
export const dashboardPathForRole = (type) => {
  switch (type) {
    case 'super_admin':
      return '/super-admin/dashboard';
    case 'administrateur':
      return '/admin/dashboard';
    case 'fournisseur':
      return '/fournisseur/dashboard';
    case 'client':
      return '/client/dashboard';
    default:
      return '/dashboard';
  }
};
