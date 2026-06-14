/** Le client peut lancer le matching de ses besoins (compte Premium activé par l'admin). */
export function clientCanSelfLaunchMatching(user) {
  if (!user || user.type_utilisateur !== 'client') return false;
  if (user.matching_self_service === true) return true;
  return user.client_abonnement_type === 'premium' && user.client_abonnement_actif === true;
}

export function clientMatchingPremiumMessage() {
  return (
    'Le lancement du matching est réservé aux comptes client Premium. '
    + 'Contactez l\'administrateur pour activer cette option sur votre compte.'
  );
}
