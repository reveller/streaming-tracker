# Streaming Tracker - Deployment Script (Windows PowerShell)
# This script helps deploy the application with Docker Compose

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Green
Write-Host "Streaming Tracker - Deployment Script" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

# Check if .env file exists
if (-not (Test-Path .env)) {
    Write-Host "No .env file found. Creating from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env

    # Generate JWT secrets
    Write-Host "Generating JWT secrets..." -ForegroundColor Yellow
    $JWT_ACCESS_SECRET = node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
    $JWT_REFRESH_SECRET = node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

    # Read .env file
    $envContent = Get-Content .env

    # Update JWT secrets
    $envContent = $envContent -replace 'JWT_ACCESS_SECRET=.*', "JWT_ACCESS_SECRET=$JWT_ACCESS_SECRET"
    $envContent = $envContent -replace 'JWT_REFRESH_SECRET=.*', "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"

    # Write back to file
    $envContent | Set-Content .env

    Write-Host "✓ .env file created with JWT secrets" -ForegroundColor Green
    Write-Host "⚠ Please edit .env and add your API keys:" -ForegroundColor Yellow
    Write-Host "  - NEO4J_PASSWORD"
    Write-Host "  - TMDB_API_KEY"
    Write-Host "  - ANTHROPIC_API_KEY"
    Write-Host ""
    Read-Host "Press Enter once you've updated the .env file"
}

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

# Determine docker-compose command
$DOCKER_COMPOSE = if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
    "docker-compose"
} else {
    Write-Host "⚠ docker-compose not found, using 'docker compose' instead" -ForegroundColor Yellow
    "docker compose"
}

# Parse command line arguments
$COMMAND = if ($args.Count -gt 0) { $args[0] } else { "up" }

switch ($COMMAND) {
    "up" {
        Write-Host ""
        Write-Host "Building and starting services..."
        & $DOCKER_COMPOSE up -d --build

        Write-Host ""
        Write-Host "✓ Services started" -ForegroundColor Green
        Write-Host ""
        Write-Host "Waiting for services to be healthy..."
        Start-Sleep -Seconds 10

        # Run migrations
        Write-Host ""
        Write-Host "Running database migrations..."
        try {
            & $DOCKER_COMPOSE exec backend npm run migrate
        } catch {
            Write-Host "⚠ Migrations may have already run" -ForegroundColor Yellow
        }

        Write-Host ""
        Write-Host "=========================================" -ForegroundColor Green
        Write-Host "Deployment complete!" -ForegroundColor Green
        Write-Host "=========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Access the application:"
        Write-Host "  Frontend: http://localhost"
        Write-Host "  Backend API: http://localhost:3001/api"
        Write-Host "  Neo4j Browser: http://localhost:7474"
        Write-Host ""
        Write-Host "View logs with: $DOCKER_COMPOSE logs -f"
        Write-Host "Stop services with: $DOCKER_COMPOSE down"
    }

    "down" {
        Write-Host "Stopping services..."
        & $DOCKER_COMPOSE down
        Write-Host "✓ Services stopped" -ForegroundColor Green
    }

    "restart" {
        Write-Host "Restarting services..."
        & $DOCKER_COMPOSE restart
        Write-Host "✓ Services restarted" -ForegroundColor Green
    }

    "logs" {
        & $DOCKER_COMPOSE logs -f
    }

    "status" {
        & $DOCKER_COMPOSE ps
    }

    "clean" {
        Write-Host "⚠ This will remove all containers and volumes. Data will be lost!" -ForegroundColor Yellow
        $response = Read-Host "Are you sure? (yes/no)"
        if ($response -eq "yes") {
            & $DOCKER_COMPOSE down -v
            Write-Host "✓ Cleaned up" -ForegroundColor Green
        } else {
            Write-Host "Cancelled"
        }
    }

    "backup" {
        Write-Host "Creating database backup..."
        $BACKUP_NAME = "neo4j-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').dump"
        New-Item -ItemType Directory -Force -Path backups | Out-Null

        docker run --rm `
          -v streaming-tracker_neo4j_data:/data `
          -v ${PWD}/backups:/backups `
          neo4j:5-community `
          neo4j-admin database dump neo4j --to=/backups/$BACKUP_NAME

        Write-Host "✓ Backup created: backups/$BACKUP_NAME" -ForegroundColor Green
    }

    "migrate" {
        Write-Host "Running database migrations..."
        & $DOCKER_COMPOSE exec backend npm run migrate
        Write-Host "✓ Migrations complete" -ForegroundColor Green
    }

    default {
        Write-Host "Usage: .\deploy.ps1 [command]"
        Write-Host ""
        Write-Host "Commands:"
        Write-Host "  up       - Build and start all services (default)"
        Write-Host "  down     - Stop all services"
        Write-Host "  restart  - Restart all services"
        Write-Host "  logs     - View logs (follow mode)"
        Write-Host "  status   - Show service status"
        Write-Host "  clean    - Remove all containers and volumes"
        Write-Host "  backup   - Create database backup"
        Write-Host "  migrate  - Run database migrations"
        exit 1
    }
}
