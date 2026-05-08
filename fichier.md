1. # Moteur de Matching

1) ## Idées

* Plus de sécurité pour les clients (donc plus de contrôles côté prestataires)  
* Intégration d’un système de paiement (OM, ou autre, à voir )  
* Comment qualifier les clients (pseudo)? Pour plus de discrétion  
* Comment contrôler la fiabilité des clients si annulation en cours de transaction (paiement d’un forfait)?  
* Comment faire l’évaluation du travail en amont (par les experts)?  
* Si prix connu on fait payer en avance et on paye le prestataire (tenir compte du transport)  
* Validation du début et fin de prestation par les 2 parties  
* Le paiement par le client se fait dès la commande de la prestation (un code )  
* Le paiement du prestataire se fait une fois la prestation faite (code de validation du client et/ou validation du prestataire)   

## 

2) ## Versions

1. Grand public avec accès ouvert à tous sans frais : objectif plus de nombre pour attirer des annonceurs  
2. Grand public avec abonnement (ou droit d’entrée) pour les prestataires : Objectif avoir un pool de prestataires de confiance et sérieux, \+ attirer des annonceurs  
3. Grand public avec compte payant pour le prestataire et compte client (demandeurs)  
4. Version B2B : comptes clients payants en SAS pour les clients et prestataires

3) ## Principe de Fonctionnement

Le moteur de matching automatique analyse les critères suivants :

* Catégories de services compatibles  
* Zones géographiques de couverture (map à intégrer)  
* Disponibilités et calendriers  
* Budget et tarification  
* Compétences et exigences spécifiques  
* Abonnement fait sur l’application

4) ## Algorithme de Scoring

Le système calcule un score de pertinence basé sur :

* Correspondance des catégories (de base)  
* Compatibilité géographique (20%) (de base ville, puis km par rapport à la localisation du Client)  
* Disponibilités (20%)  
* Expérience et certifications (20%)  
* Abonnement (40%)

Ce matching sera à faire pour une durée préférentielle bien définie (1h, 2h, …).  
Puis on ouvre :

1. Sur couverture géographique sur 10km supplémentaires  
2. Puis ouverture générale   
   

# Reorganiser le fichier word
## I.	Moteur de Matching – Les grandes idées
## II.	Moteur de Matching : La mise en œuvre et ajustements