# PowerShell helper script to apply raw SQL migrations using psql
# Requires PostgreSQL client installed and psql in PATH.
# Usage: ./scripts/migrate-local.ps1 -Db quetzal_db -User postgres
param(
  [string]$Db = "quetzal_db",
  [string]$User = "postgres"
)

Write-Host "Running raw migrations against database '$Db'..." -ForegroundColor Cyan

$base = "$PSScriptRoot/../migrations"

$files = @(
  "002_create_transactions_table.sql",
  "003_create_contracts_table.sql",
  "004_create_messaging_tables.sql"
)

foreach ($f in $files) {
  $path = Join-Path $base $f
  if (Test-Path $path) {
    Write-Host "Applying $f" -ForegroundColor Yellow
    psql -U $User -d $Db -f $path
    if ($LASTEXITCODE -ne 0) {
      Write-Host "Migration $f failed" -ForegroundColor Red
      exit 1
    }
  } else {
    Write-Host "File not found: $path" -ForegroundColor Red
    exit 1
  }
}

Write-Host "All migrations applied successfully" -ForegroundColor Green