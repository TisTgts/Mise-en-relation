"""
Compatibilité : redirige vers seed_togo_demo (Lomé / Sokodé).

Usage préféré :
  python manage.py seed_togo_demo
"""
from accounts.management.commands.seed_togo_demo import Command as TogoCommand


class Command(TogoCommand):
    help = "Alias déprécié de seed_togo_demo (Togo — Lomé / Sokodé)."
