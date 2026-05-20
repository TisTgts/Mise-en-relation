# Double-clic ou : powershell -ExecutionPolicy Bypass -File demarrer-local.ps1
# Lance le backend Django en local

Write-Host "=== AppName - demarrage backend ===" -ForegroundColor Cyan
Set-Location $PSScriptRoot\backend

if (-not (Test-Path "..\venv")) {
    Write-Host "Creation du virtualenv..." -ForegroundColor Yellow
    python -m venv ..\venv
}

& "..\venv\Scripts\Activate.ps1"
pip install -q -r requirements.txt
python manage.py migrate --no-input 2>$null
Write-Host ""
Write-Host "Backend : http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "Ouvrez un 2e terminal et lancez : cd frontend ; npm start" -ForegroundColor Yellow
Write-Host ""
python manage.py runserver
