$env:DB_URL = "jdbc:postgresql://localhost:5433/seal_hackathon"
$env:DB_USERNAME = "postgres"
$env:DB_PASSWORD = "postgres"
$env:SERVER_PORT = "8085"
$env:AI_REVIEW_INTERVAL_MINUTES = "30"
$env:FILE_STORAGE_PATH = "../storage"

mvn spring-boot:run