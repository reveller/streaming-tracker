#!/bin/bash

# Streaming Tracker - Deployment Script
# This script helps deploy the application with Docker Compose

set -e

echo "========================================="
echo "Streaming Tracker - Deployment Script"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}No .env file found. Creating from .env.example...${NC}"
    cp .env.example .env

    # Generate JWT secrets
    echo -e "${YELLOW}Generating JWT secrets...${NC}"
    JWT_ACCESS_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

    # Update .env file
    sed -i.bak "s/JWT_ACCESS_SECRET=.*/JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}/" .env
    sed -i.bak "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}/" .env
    rm .env.bak 2>/dev/null || true

    echo -e "${GREEN}✓ .env file created with JWT secrets${NC}"
    echo -e "${YELLOW}⚠ Please edit .env and add your API keys:${NC}"
    echo "  - NEO4J_PASSWORD"
    echo "  - TMDB_API_KEY"
    echo "  - ANTHROPIC_API_KEY"
    echo ""
    read -p "Press Enter once you've updated the .env file..."
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker is running${NC}"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}⚠ docker-compose not found, using 'docker compose' instead${NC}"
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Parse command line arguments
COMMAND=${1:-up}

case $COMMAND in
    up)
        echo ""
        echo "Building and starting services..."
        $DOCKER_COMPOSE up -d --build

        echo ""
        echo -e "${GREEN}✓ Services started${NC}"
        echo ""
        echo "Waiting for services to be healthy..."
        sleep 10

        # Run migrations
        echo ""
        echo "Running database migrations..."
        $DOCKER_COMPOSE exec backend npm run migrate || echo -e "${YELLOW}⚠ Migrations may have already run${NC}"

        echo ""
        echo -e "${GREEN}=========================================${NC}"
        echo -e "${GREEN}Deployment complete!${NC}"
        echo -e "${GREEN}=========================================${NC}"
        echo ""
        echo "Access the application:"
        echo "  Frontend: http://localhost"
        echo "  Backend API: http://localhost:3001/api"
        echo "  Neo4j Browser: http://localhost:7474"
        echo ""
        echo "View logs with: $DOCKER_COMPOSE logs -f"
        echo "Stop services with: $DOCKER_COMPOSE down"
        ;;

    down)
        echo "Stopping services..."
        $DOCKER_COMPOSE down
        echo -e "${GREEN}✓ Services stopped${NC}"
        ;;

    restart)
        echo "Restarting services..."
        $DOCKER_COMPOSE restart
        echo -e "${GREEN}✓ Services restarted${NC}"
        ;;

    logs)
        $DOCKER_COMPOSE logs -f
        ;;

    status)
        $DOCKER_COMPOSE ps
        ;;

    clean)
        echo -e "${YELLOW}⚠ This will remove all containers and volumes. Data will be lost!${NC}"
        read -p "Are you sure? (yes/no): " -r
        if [[ $REPLY == "yes" ]]; then
            $DOCKER_COMPOSE down -v
            echo -e "${GREEN}✓ Cleaned up${NC}"
        else
            echo "Cancelled"
        fi
        ;;

    backup)
        echo "Creating database backup..."
        BACKUP_NAME="neo4j-backup-$(date +%Y%m%d-%H%M%S).dump"
        mkdir -p backups

        docker run --rm \
          -v streaming-tracker_neo4j_data:/data \
          -v $(pwd)/backups:/backups \
          neo4j:5-community \
          neo4j-admin database dump neo4j --to=/backups/$BACKUP_NAME

        echo -e "${GREEN}✓ Backup created: backups/$BACKUP_NAME${NC}"
        ;;

    migrate)
        echo "Running database migrations..."
        $DOCKER_COMPOSE exec backend npm run migrate
        echo -e "${GREEN}✓ Migrations complete${NC}"
        ;;

    *)
        echo "Usage: ./deploy.sh [command]"
        echo ""
        echo "Commands:"
        echo "  up       - Build and start all services (default)"
        echo "  down     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  logs     - View logs (follow mode)"
        echo "  status   - Show service status"
        echo "  clean    - Remove all containers and volumes"
        echo "  backup   - Create database backup"
        echo "  migrate  - Run database migrations"
        exit 1
        ;;
esac
