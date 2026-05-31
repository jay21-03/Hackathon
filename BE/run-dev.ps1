$env:SERVER_PORT = "8085"
$env:DB_URL = "jdbc:postgresql://localhost:5433/seal_hackathon"
$env:DB_USERNAME = "postgres"
$env:DB_PASSWORD = "postgres"

$env:GOOGLE_CLIENT_ID = "375393891941-invk4kstp7pq1r1n2c9qspupn6hen025.apps.googleusercontent.com"
$env:JWT_SECRET = "local_dev_secret_change_me_please_32_chars_minimum"
$env:JWT_EXPIRATION_MINUTES = "1440"
$env:ALLOWED_EMAIL_DOMAINS = "fpt.edu.vn,fe.edu.vn,gmail.com"
$env:APP_BOOTSTRAP_ORGANIZER_EMAIL = "REPLACE_WITH_YOUR_TEST_EMAIL@gmail.com"
$env:CORS_ALLOWED_ORIGINS = "http://localhost:5173"
$env:DEV_AUTH_ENABLED = "false"

$env:AI_REVIEW_INTERVAL_MINUTES = "30"
$env:FILE_STORAGE_PATH = "../storage"

mvn spring-boot:run
