#!/usr/bin/env bash
# Script de build pour Render / Railway (backend Django)
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate --no-input
