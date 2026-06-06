# Load Hackathon/.env when present (mail, JWT, Google client, etc.)
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

# Local BE overrides (Postgres host port mapped by docker-compose)
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
if (-not $env:AI_REVIEW_INTERVAL_MINUTES) { $env:AI_REVIEW_INTERVAL_MINUTES = "30" }
if (-not $env:FILE_STORAGE_PATH) { $env:FILE_STORAGE_PATH = "../storage" }
if (-not $env:MAIL_HOST) { $env:MAIL_HOST = "smtp.gmail.com" }
if (-not $env:MAIL_PORT) { $env:MAIL_PORT = "587" }
if (-not $env:MAIL_SMTP_AUTH) { $env:MAIL_SMTP_AUTH = "true" }
if (-not $env:MAIL_SMTP_STARTTLS_ENABLE) { $env:MAIL_SMTP_STARTTLS_ENABLE = "true" }
if (-not $env:INVITATION_BASE_URL) { $env:INVITATION_BASE_URL = "http://localhost:5173" }
if (-not $env:MAIL_ENABLED) { $env:MAIL_ENABLED = "false" }

Write-Host "MAIL_ENABLED=$($env:MAIL_ENABLED) MAIL_FROM=$($env:MAIL_FROM)"
Write-Host "Sau khi pull code moi: restart BE de Flyway chay migration (can V21+ cho thong bao)." -ForegroundColor Yellow

mvn spring-boot:run
