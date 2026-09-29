# Build APK / AAB Android via EAS
# Prérequis : compte Expo connecté (eas login)
# Projet : @gaetankorogo/appname-mobile (projet EAS dédié à toghinis.net)
#
#   .\build-apk.ps1                      # APK preview
#   .\build-apk.ps1 -Profile production  # AAB Play Store
#   .\build-apk.ps1 -SkipChecks

param(
  [ValidateSet('preview', 'production')]
  [string]$Profile = 'preview',
  [switch]$SkipChecks
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "=== AppName Mobile — Release ($Profile) ===" -ForegroundColor Cyan
Write-Host "  API     : https://toghinis.net/api" -ForegroundColor Gray
Write-Host "  Env     : production (HTTPS strict)" -ForegroundColor Gray
Write-Host "  Package : com.appname.mobile" -ForegroundColor Gray
if ($Profile -eq 'preview') {
  Write-Host "  Artefact: APK (tests internes)" -ForegroundColor Gray
} else {
  Write-Host "  Artefact: AAB (Play Store)" -ForegroundColor Gray
}
Write-Host ""

if (-not $SkipChecks) {
  Write-Host "Checklist avant build :" -ForegroundColor Yellow
  Write-Host "  [ ] API prod joignable (https://toghinis.net/api)"
  Write-Host "  [ ] Smoke-test : login, besoin/prestation, matching, message, PJ, logout"
  Write-Host "  [ ] Suppression de compte OK (Play Store)"
  Write-Host "  [ ] CGU / confidentialite en ligne"
  Write-Host "  [ ] Captures ecran pretes (si store)"
  Write-Host ""
  $confirm = Read-Host "Lancer le build EAS maintenant ? (o/N)"
  if ($confirm -notmatch '^[oOyY]') {
    Write-Host "Annule." -ForegroundColor DarkYellow
    exit 0
  }
}

$hasEas = Get-Command eas -ErrorAction SilentlyContinue
if (-not $hasEas) {
  Write-Host "eas-cli global absent — npx eas-cli" -ForegroundColor Yellow
}

$whoami = if ($hasEas) { & eas whoami 2>$null } else { & npx --yes eas-cli whoami 2>$null }
if (-not $whoami) {
  Write-Host "Connectez-vous a Expo :" -ForegroundColor Yellow
  if ($hasEas) { & eas login } else { & npx --yes eas-cli login }
}

Write-Host ""
Write-Host "Demarrage eas build..." -ForegroundColor Cyan
if ($hasEas) {
  & eas build --platform android --profile $Profile --non-interactive
} else {
  & npx --yes eas-cli build --platform android --profile $Profile --non-interactive
}

Write-Host ""
Write-Host "Historique : eas build:list" -ForegroundColor Green
Write-Host "Confidentialite : https://toghinis.net/confidentialite" -ForegroundColor Green
Write-Host "CGU             : https://toghinis.net/cgu" -ForegroundColor Green
