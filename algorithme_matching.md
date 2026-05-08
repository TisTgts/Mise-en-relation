# Moteur de Matching - Spec V1

## 1) Objectif

Construire un algorithme de matching qui sélectionne les meilleurs prestataires pour un besoin client en tenant compte :

- de la pertinence métier (catégorie, compétences),
- de la faisabilité (distance, disponibilité),
- de la confiance (fiabilité, annulations, litiges),
- des contraintes business (abonnement, priorités commerciales).

## 2) Approche générale

L'algorithme se fait en deux étapes :

1. **Filtrage dur (éliminatoire)** : retirer les prestataires non éligibles.
2. **Scoring pondéré (0 à 100)** : calculer un score pour classer les candidats restants.

## 3) Filtrage dur (obligatoire)

Un prestataire est éliminé s'il ne respecte pas au moins une règle :

- catégorie/service incompatible,
- hors zone maximum (ex: > 20 km au lancement),
- indisponible au créneau demandé,
- statut inactif ou vérification incomplète.

Sortie de cette étape : une liste de candidats valides.

## 4) Algorithme de scoring (V1)

Formule :

`Score = wc*C + wg*G + wd*D + wf*F + wp*P + wa*A`

### Pondérations recommandées au départ

- `C` (compétence/catégorie) : **25%**
- `G` (géographique/distance) : **20%**
- `D` (disponibilité/réactivité) : **20%**
- `F` (fiabilité) : **15%**
- `P` (prix/budget) : **10%**
- `A` (abonnement/priorité commerciale) : **10%**

## 5) Définition des sous-scores (0..100)

### C - Compétence

- 100 : catégorie exacte + compétences requises
- 70 : catégorie proche
- 0 : incompatible

### G - Géographie

Exemple :

`G = max(0, 100 - 5 * distance_km)`

### D - Disponibilité

- 100 : immédiatement disponible
- 80 : disponible < 2h
- 60 : disponible < 24h
- 20 : au-delà

### F - Fiabilité

Exemple (borné ensuite entre 0 et 100) :

`F = 100 - (annulation_rate*50 + retard_rate*20 + litige_rate*30)`

### P - Prix/Budget

- 100 : dans le budget idéal
- score décroissant si dépassement budget

### A - Abonnement

- premium = 100
- standard = 70

Important : plafonner l'impact abonnement (ex: max +10 points réels) pour éviter un biais trop fort.

## 6) Règles d'équité et qualité

- Ajouter une petite rotation pour ne pas exposer toujours les mêmes prestataires.
- Gérer le cold start des nouveaux prestataires (score neutre + petit boost temporaire).
- Limiter les biais géographiques entre zones denses et peu denses.

## 7) Ouverture progressive (si aucun match rapide)

- **Phase 1 (0-10 min)** : rayon restreint (ex: 5 km)
- **Phase 2 (10-30 min)** : élargissement (10-15 km)
- **Phase 3 (30+ min)** : ouverture générale

## 8) Données à stocker en base

- `providers` : profil, statut, abonnement, note moyenne
- `provider_skills` : catégories et compétences
- `provider_availability` : disponibilités/calendrier
- `provider_metrics` : taux d'annulation, retard, litige, no-show
- `requests` / `besoins` : catégorie, budget, localisation, date/heure
- `match_logs` : score global + détail des sous-scores par candidat

## 9) Pseudo-code backend

```js
function matchProviders(request) {
  let candidates = getActiveProviders();

  candidates = candidates.filter((p) =>
    isCategoryCompatible(p, request) &&
    isInMaxDistance(p, request, 20) &&
    isAvailable(p, request.datetime)
  );

  const scored = candidates.map((p) => {
    const C = scoreCompetence(p, request);      // 0..100
    const G = scoreDistance(p, request);        // 0..100
    const D = scoreAvailability(p, request);    // 0..100
    const F = scoreReliability(p);              // 0..100
    const P = scorePrice(p, request);           // 0..100
    const A = scoreSubscription(p);             // 0..100

    const total =
      0.25 * C +
      0.20 * G +
      0.20 * D +
      0.15 * F +
      0.10 * P +
      0.10 * A;

    return { provider: p, total, breakdown: { C, G, D, F, P, A } };
  });

  return scored.sort((a, b) => b.total - a.total).slice(0, 10);
}
```

## 10) Roadmap de mise en place (1 semaine)

- **Jour 1** : schéma base + fonctions de sous-score
- **Jour 2** : endpoint `POST /matching/run/:besoinId`
- **Jour 3** : logs de matching + vue admin basique
- **Jour 4** : ouverture progressive par tâches planifiées
- **Jour 5** : tests + calibration des poids

## 11) Évolution vers V2

Après collecte de données réelles :

- ajuster les poids selon les performances observées,
- lancer des A/B tests de pondération,
- évoluer vers un ranking plus intelligent (learning-to-rank) si nécessaire.
