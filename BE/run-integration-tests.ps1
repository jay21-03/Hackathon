# Windows: requires Docker Desktop → Settings → General → expose daemon on tcp://localhost:2375
$ErrorActionPreference = "Stop"
$env:DOCKER_HOST = "tcp://127.0.0.1:2375"
Remove-Item Env:TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE -ErrorAction SilentlyContinue

Write-Host "DOCKER_HOST=$env:DOCKER_HOST"
mvn test -Pdocker-tcp @args
