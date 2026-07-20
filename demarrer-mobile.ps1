# Demarrage mobile Toghinis (Expo SDK 54 — compatible Expo Go store)
#
#   powershell -ExecutionPolicy Bypass -File demarrer-mobile.ps1
#   powershell -ExecutionPolicy Bypass -File demarrer-mobile.ps1 -Web
#   powershell -ExecutionPolicy Bypass -File demarrer-mobile.ps1 -Tunnel
#   powershell -ExecutionPolicy Bypass -File demarrer-mobile.ps1 -Offline

param(
    [switch]$Tunnel,
    [switch]$Web,
    [switch]$Offline,
    [switch]$Local
)

$ProductionApi = "https://toghinis.com/api"

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
$MobileDir = Join-Path $Root "mobile"

Write-Host ""
Write-Host "=== Toghinis Mobile (Expo SDK 54) ===" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $MobileDir)) {
    Write-Host "ERREUR : dossier mobile/ introuvable." -ForegroundColor Red
    exit 1
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERREUR : Node.js introuvable." -ForegroundColor Red
    exit 1
}

Write-Host "Node : $(node -v) | npm : $(npm -v)"

$lanIp = $null
try {
    $lanIp = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object {
            $_.IPAddress -notlike "127.*" -and
            $_.IPAddress -notlike "169.254.*" -and
            $_.PrefixOrigin -ne "WellKnown"
        } |
        Sort-Object InterfaceMetric |
        Select-Object -First 1 -ExpandProperty IPAddress
} catch { }

$envFile = Join-Path $MobileDir ".env"
if (-not (Test-Path $envFile)) {
    if ($Local -and $lanIp) {
        $apiUrl = "http://${lanIp}:8000/api"
    } elseif ($Local) {
        $apiUrl = "http://10.0.2.2:8000/api"
    } else {
        $apiUrl = $ProductionApi
    }
    Set-Content -Path $envFile -Value "EXPO_PUBLIC_API_URL=$apiUrl" -Encoding ascii
    Write-Host ".env cree -> $apiUrl" -ForegroundColor Yellow
} else {
    $current = (Get-Content $envFile -Raw)
    Write-Host ".env : $($current.Trim())" -ForegroundColor Green
    if ($Local -and $lanIp -and ($current -match "toghinis\.com")) {
        $apiUrl = "http://${lanIp}:8000/api"
        Set-Content -Path $envFile -Value "EXPO_PUBLIC_API_URL=$apiUrl" -Encoding ascii
        Write-Host ".env bascule en local -> $apiUrl" -ForegroundColor Yellow
    }
}

Set-Location $MobileDir

if (-not (Test-Path "node_modules\expo")) {
    Write-Host "Installation npm..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) { exit 1 }
}

$apiCheckUrl = $ProductionApi + "/config/country/"
$backendOk = $false
try {
    $resp = Invoke-WebRequest -Uri $apiCheckUrl -UseBasicParsing -TimeoutSec 8
    if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500) { $backendOk = $true }
} catch { }

Write-Host ""
if ($backendOk) {
    Write-Host "[OK] API en ligne : $ProductionApi" -ForegroundColor Green
} else {
    Write-Host "[!] API en ligne injoignable — verifie ta connexion ou utilise -Local" -ForegroundColor Yellow
}

if ($Local) {
    try {
        $local = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/config/country/" -UseBasicParsing -TimeoutSec 2
        if ($local.StatusCode -ge 200) {
            Write-Host "[OK] Backend local sur :8000" -ForegroundColor Green
        }
    } catch {
        Write-Host "[!] Backend local absent — lance demarrer-local.ps1" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Ouvrir l'app :" -ForegroundColor Cyan
Write-Host "  w = navigateur (test rapide)"
Write-Host "  a = emulateur Android"
Write-Host "  Expo Go = meme Wi-Fi, scanner QR OU saisir l'URL"
if ($lanIp) {
    Write-Host "  URL manuelle : exp://${lanIp}:8081" -ForegroundColor White
}
Write-Host "  Expo Go doit etre a jour (SDK 54+)" -ForegroundColor Yellow
Write-Host ""

# Ne PAS forcer CI=1 : provoque des echecs de manifest anonymes
Remove-Item Env:CI -ErrorAction SilentlyContinue

if ($Web) {
    npx expo start --web --clear
} elseif ($Tunnel) {
    npx expo start --tunnel --clear
} elseif ($Offline) {
    npx expo start --lan --offline --clear
} else {
    npx expo start --lan --clear
}
