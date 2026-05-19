# Identifiants Utilisateurs (Test)

> Document de test. Ne pas utiliser en production.

## Mot de passe

- Tous les comptes seed utilisent le même mot de passe : `demo1234`.

## Administrateurs

| Username | Email             | Nom affiché        |
|----------|-------------------|--------------------|
| admin    | admin@demo.local  | Mamadou Kaboré     |
| admin2   | admin2@demo.local | Salimata Ouédraogo |

## Clients (10)

| Username       | Email                      | Nom affiché      |
|----------------|----------------------------|------------------|
| client_demo    | client@demo.local          | Ibrahim Zongo    |
| client2_demo   | client2@demo.local         | Aïssata Traoré   |
| client_bulk_03 | client_bulk_03@demo.local  | Moussa Compaoré  |
| client_bulk_04 | client_bulk_04@demo.local  | Aminata Savadogo |
| client_bulk_05 | client_bulk_05@demo.local  | Issa Sanou       |
| client_bulk_06 | client_bulk_06@demo.local  | Mariam Koné      |
| client_bulk_07 | client_bulk_07@demo.local  | Adama Nikiema    |
| client_bulk_08 | client_bulk_08@demo.local  | Fatoumata Diallo |
| client_bulk_09 | client_bulk_09@demo.local  | Oumar Barro      |
| client_bulk_10 | client_bulk_10@demo.local  | Binta Ouattara   |

## Fournisseurs (10)

| Username            | Email                           | Nom affiché        |
|---------------------|---------------------------------|--------------------|
| fournisseur_demo    | fournisseur@demo.local          | Amadou Sawadogo    |
| presta_sarl         | contact@presta-sarl.demo        | Fatou Bance        |
| fournisseur_bulk_03 | fournisseur_bulk_03@demo.local  | Boubacar Zoungrana |
| fournisseur_bulk_04 | fournisseur_bulk_04@demo.local  | Clarisse Pare      |
| fournisseur_bulk_05 | fournisseur_bulk_05@demo.local  | Hamidou Bado       |
| fournisseur_bulk_06 | fournisseur_bulk_06@demo.local  | Kadidia Somé       |
| fournisseur_bulk_07 | fournisseur_bulk_07@demo.local  | Seydou Ilboudo     |
| fournisseur_bulk_08 | fournisseur_bulk_08@demo.local  | Zenabou Kafando    |
| fournisseur_bulk_09 | fournisseur_bulk_09@demo.local  | Yacouba Nana       |
| fournisseur_bulk_10 | fournisseur_bulk_10@demo.local  | Hortense Dabiré    |

## Remarque

- **Logins inchangés** : username, email et mot de passe `demo1234` restent fixes.
- **Personnes modifiables** : éditez `first_name` / `last_name` dans `backend/accounts/data/seed_users.json`, puis `python manage.py seed_db --reset`.
- Source unique des comptes : `seed_users.json` (plus de génération automatique `client_bf_XX`).
