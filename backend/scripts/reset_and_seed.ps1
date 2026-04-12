# Reinitialise SQLite et peuple la base (arreter runserver avant).
$ErrorActionPreference = "Stop"
$BackendRoot = Split-Path -Parent $PSScriptRoot
Set-Location $BackendRoot
& .\venv\Scripts\python.exe manage.py seed_db --reset
