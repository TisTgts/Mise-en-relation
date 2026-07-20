# Lance backend Django + Expo mobile dans 2 fenetres separees (demarrage sur).
# Utilise aussi depuis Debug Cursor : "Demarrage sur: Django + Mobile"

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot

Write-Host ""
Write-Host "=== Toghinis - demarrage sur Django + Mobile ===" -ForegroundColor Cyan
Write-Host ""

$local = Join-Path $Root "demarrer-local.ps1"
$mobile = Join-Path $Root "demarrer-mobile.ps1"

if (-not (Test-Path $local)) {
    Write-Host "ERREUR : demarrer-local.ps1 introuvable." -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $mobile)) {
    Write-Host "ERREUR : demarrer-mobile.ps1 introuvable." -ForegroundColor Red
    exit 1
}

Write-Host "Ouverture terminal Backend (Django)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-File", $local
)

Start-Sleep -Seconds 2

Write-Host "Ouverture terminal Mobile (Expo)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-File", $mobile
)

Write-Host ""
Write-Host "OK — 2 fenetres lancees :" -ForegroundColor Green
Write-Host "  1) Backend  http://127.0.0.1:8000"
Write-Host "  2) Mobile   Expo (QR / touche a)"
Write-Host ""
Write-Host "Pour attacher le debugger mobile ensuite :" -ForegroundColor Cyan
Write-Host "  Run and Debug → Mobile: Attach Expo (Hermes) → F5"
Write-Host ""
