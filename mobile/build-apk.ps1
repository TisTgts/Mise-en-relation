# Build APK Android via EAS (Expo Application Services)
# Prérequis :
#   1. npm install -g eas-cli
#   2. eas login
#   3. eas init   (une seule fois — génère le projectId)
#
# L'APK pointe vers l'API prod : https://toghinis.com/api
# (défini dans eas.json profil "preview")

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Get-Command eas -ErrorAction SilentlyContinue)) {
  Write-Host "Installation de eas-cli..." -ForegroundColor Yellow
  npm install -g eas-cli
}

# Vérifier la connexion Expo
$whoami = eas whoami 2>$null
if (-not $whoami) {
  Write-Host "Connectez-vous à Expo :" -ForegroundColor Yellow
  eas login
}

# Lier le projet si pas encore de projectId
$config = Get-Content ".\app.config.js" -Raw
if ($config -notmatch "projectId" -or -not (Test-Path ".\.eas")) {
  Write-Host "Initialisation EAS (projectId) si nécessaire..." -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Build APK (profil preview)" -ForegroundColor Cyan
Write-Host "  API  : https://toghinis.com/api" -ForegroundColor Gray
Write-Host "  Env  : production (HTTPS strict)" -ForegroundColor Gray
Write-Host "Le lien de téléchargement s'affichera à la fin." -ForegroundColor Gray
Write-Host ""

eas build --platform android --profile preview

Write-Host ""
Write-Host "Historique : eas build:list" -ForegroundColor Green
Write-Host "Installer l'APK sur le téléphone puis tester login / messages." -ForegroundColor Green
