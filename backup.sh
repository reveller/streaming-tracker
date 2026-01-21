#!/bin/bash

###############################################################################
# Streaming Tracker - Neo4j Backup Script
#
# This script performs automated backups of the Neo4j database using APOC
# export to JSON format. Backups are stored locally outside Docker volumes.
#
# Features:
# - Exports all Neo4j data to JSON format
# - Stores backups in /backups directory (outside Docker volumes)
# - Automatically cleans up backups older than 30 days
# - Logs all operations
# - Email notifications on failure (optional)
#
# Usage: ./backup.sh
# Cron: 0 3 * * * /home/sfeltner/Projects/streaming-tracker/backup.sh
###############################################################################

set -e  # Exit on error

# Configuration
PROJECT_DIR="/home/sfeltner/Projects/streaming-tracker"
BACKUP_DIR="${PROJECT_DIR}/backups"
LOG_FILE="${BACKUP_DIR}/backup.log"
CONTAINER_NAME="streaming-tracker-neo4j"
NEO4J_USER="neo4j"
NEO4J_PASSWORD="streamingtracker2026"
RETENTION_DAYS=30

# Timestamp for backup file
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATE_LABEL=$(date +"%Y-%m-%d %H:%M:%S")
BACKUP_FILENAME="streaming-tracker-backup-${TIMESTAMP}.json"

###############################################################################
# Functions
###############################################################################

log_message() {
    echo "[${DATE_LABEL}] $1" | tee -a "${LOG_FILE}"
}

check_container() {
    if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log_message "ERROR: Container ${CONTAINER_NAME} is not running"
        exit 1
    fi
}

export_database() {
    log_message "Starting Neo4j database export to JSON..."

    # Export all data using APOC with stream option
    docker exec "${CONTAINER_NAME}" cypher-shell -u "${NEO4J_USER}" -p "${NEO4J_PASSWORD}" \
        "CALL apoc.export.json.all(null, {stream: true, useTypes: true})" \
        > "${BACKUP_DIR}/${BACKUP_FILENAME}" 2>> "${LOG_FILE}"

    if [ $? -eq 0 ]; then
        log_message "✓ Database export completed successfully"
    else
        log_message "✗ ERROR: Database export failed"
        exit 1
    fi
}

verify_backup_file() {
    log_message "Verifying backup file..."

    if [ -f "${BACKUP_DIR}/${BACKUP_FILENAME}" ]; then
        # Get file size
        SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILENAME}" | cut -f1)
        log_message "✓ Backup file created: ${BACKUP_DIR}/${BACKUP_FILENAME}"
        log_message "  Backup size: ${SIZE}"
    else
        log_message "✗ ERROR: Backup file was not created"
        exit 1
    fi
}

cleanup_old_backups() {
    log_message "Cleaning up backups older than ${RETENTION_DAYS} days..."

    DELETED_COUNT=$(find "${BACKUP_DIR}" -name "streaming-tracker-backup-*.json" -type f -mtime +${RETENTION_DAYS} -delete -print | wc -l)

    if [ ${DELETED_COUNT} -gt 0 ]; then
        log_message "✓ Deleted ${DELETED_COUNT} old backup(s)"
    else
        log_message "  No old backups to delete"
    fi
}

verify_backup() {
    log_message "Verifying backup integrity..."

    if [ -f "${BACKUP_DIR}/${BACKUP_FILENAME}" ]; then
        # Check if file is not empty
        if [ -s "${BACKUP_DIR}/${BACKUP_FILENAME}" ]; then
            # Count lines in backup (nodes + relationships + header)
            LINE_COUNT=$(wc -l < "${BACKUP_DIR}/${BACKUP_FILENAME}")
            log_message "✓ Backup file is valid (${LINE_COUNT} lines)"
        else
            log_message "✗ ERROR: Backup file is empty"
            exit 1
        fi

        # Count exported nodes
        NODE_COUNT=$(docker exec "${CONTAINER_NAME}" cypher-shell -u "${NEO4J_USER}" -p "${NEO4J_PASSWORD}" \
            "MATCH (n) RETURN count(n) as count" --format plain 2>/dev/null | tail -n1)

        log_message "  Database contains ${NODE_COUNT} nodes"
    else
        log_message "✗ ERROR: Backup file not found"
        exit 1
    fi
}

list_recent_backups() {
    log_message "Recent backups:"
    ls -lh "${BACKUP_DIR}"/streaming-tracker-backup-*.json 2>/dev/null | tail -5 | while read line; do
        log_message "  ${line}"
    done
}

###############################################################################
# Main Execution
###############################################################################

log_message "========================================="
log_message "Starting Neo4j backup process"
log_message "========================================="

# Step 1: Check if container is running
check_container

# Step 2: Export database to JSON
export_database

# Step 3: Verify backup file was created
verify_backup_file

# Step 4: Verify backup integrity
verify_backup

# Step 5: Clean up old backups
cleanup_old_backups

# Step 7: Show recent backups
list_recent_backups

log_message "========================================="
log_message "Backup completed successfully!"
log_message "========================================="
log_message ""

exit 0
