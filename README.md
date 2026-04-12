# ServiceConnect - Plateforme de Mise en Relation

## Description
Plateforme numérique de mise en relation entre offreurs et demandeurs de services professionnels.

## Architecture
- **Frontend**: React.js avec Tailwind CSS
- **Backend**: Django avec Django Rest Framework
- **Base de données**: PostgreSQL

## Structure du projet
```
mise_en_relation/
├── frontend/          # Application React
├── backend/           # Application Django
└── README.md         # Ce fichier
```

## Installation

### Frontend
```bash
cd frontend
npm install
npm start
```

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## Fonctionnalités
- Gestion des profils utilisateurs (Offreurs/Demandeurs)
- Publication d'offres et de besoins de services
- Moteur de matching automatique
- Messagerie interne
- Suivi des transactions
