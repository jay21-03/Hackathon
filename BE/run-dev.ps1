# CHI dung khi debug BE bang JVM tren may (khong qua Docker).
# Dev hang ngay: tu thu muc Hackathon chay .\start-dev.ps1
$ErrorActionPreference = "Stop"

function Test-PortInUse([int]$Port) {
    return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

$dockerBackend = docker ps --filter "name=^seal_backend$" --filter "status=running" -q 2>$null
if ($dockerBackend) {
    Write-Host "seal_backend Docker dang chay tren port 8085." -ForegroundColor Yellow
    Write-Host "Khong can run-dev.ps1. Dung Docker: cd .. ; .\start-dev.ps1" -ForegroundColor Yellow
    Write-Host "Neu muon chay JVM: docker compose stop backend" -ForegroundColor Yellow
    exit 1
}

if (Test-PortInUse 8085) {
    Write-Host "Port 8085 da bi chiem. Dung process do truoc khi chay mvn." -ForegroundColor Red
    Write-Host "Get-NetTCPConnection -LocalPort 8085 -State Listen" -ForegroundColor Yellow
    exit 1
}

function Assert-PostgresRunning {
    try {
        $names = docker ps --filter "name=^seal_postgres$" --filter "status=running" -q 2>$null
        if (-not $names) {
            Write-Host "Postgres chua chay. Tu thu muc Hackathon:" -ForegroundColor Yellow
            Write-Host "  .\start-dev.ps1" -ForegroundColor Yellow
            Write-Host "hoac: docker compose up -d postgres" -ForegroundColor Yellow
            exit 1
        }
        Write-Host "Postgres OK (seal_postgres)" -ForegroundColor Green
    } catch {
        Write-Host "Can Docker Desktop cho Postgres (port 5433)." -ForegroundColor Red
        exit 1
    }
}

Assert-PostgresRunning

$dotenvPath = Join-Path $PSScriptRoot "..\.env"
if (Test-Path $dotenvPath) {
    Get-Content $dotenvPath | ForEach-Object {
        $line = $_.Trim()
        if ($line -eq "" -or $line.StartsWith("#")) { return }
        $eq = $line.IndexOf("=")
        if ($eq -lt 1) { return }
        $key = $line.Substring(0, $eq).Trim()
        $val = $line.Substring($eq + 1).Trim()
        if ($val.Length -ge 2 -and $val.StartsWith('"') -and $val.EndsWith('"')) {
            $val = $val.Substring(1, $val.Length - 2)
        }
        Set-Item -Path "env:$key" -Value $val
    }
}

$env:SERVER_PORT = "8085"
$env:DB_URL = "jdbc:postgresql://localhost:5433/seal_hackathon"
$env:DB_USERNAME = if ($env:DB_USERNAME) { $env:DB_USERNAME } else { "postgres" }
$env:DB_PASSWORD = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "postgres" }

if (-not $env:GOOGLE_CLIENT_ID) {
    $env:GOOGLE_CLIENT_ID = "375393891941-invk4kstp7pq1r1n2c9qspupn6hen025.apps.googleusercontent.com"
}
if (-not $env:JWT_SECRET) {
    $env:JWT_SECRET = "local_dev_secret_change_me_please_32_chars_minimum"
}
if (-not $env:JWT_EXPIRATION_MINUTES) { $env:JWT_EXPIRATION_MINUTES = "1440" }
if (-not $env:ALLOWED_EMAIL_DOMAINS) {
    $env:ALLOWED_EMAIL_DOMAINS = "fpt.edu.vn,fe.edu.vn,gmail.com,seal.edu.vn"
}
if (-not $env:CORS_ALLOWED_ORIGINS) {
    $env:CORS_ALLOWED_ORIGINS = "http://localhost:5173,http://localhost:5174"
}
if (-not $env:DEV_AUTH_ENABLED) { $env:DEV_AUTH_ENABLED = "true" }
if (-not $env:FILE_STORAGE_PATH) { $env:FILE_STORAGE_PATH = "../storage" }
if (-not $env:MAIL_HOST) { $env:MAIL_HOST = "smtp.gmail.com" }
if (-not $env:MAIL_PORT) { $env:MAIL_PORT = "587" }
if (-not $env:MAIL_SMTP_AUTH) { $env:MAIL_SMTP_AUTH = "true" }
if (-not $env:MAIL_SMTP_STARTTLS_ENABLE) { $env:MAIL_SMTP_STARTTLS_ENABLE = "true" }
if (-not $env:INVITATION_BASE_URL) { $env:INVITATION_BASE_URL = "http://localhost:5173" }
if (-not $env:MAIL_ENABLED) { $env:MAIL_ENABLED = "false" }

Write-Host "Che do JVM local (khong Docker backend)." -ForegroundColor Cyan
Write-Host "MAIL_ENABLED=$($env:MAIL_ENABLED) MAIL_FROM=$($env:MAIL_FROM)"

mvn spring-boot:run
