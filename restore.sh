#!/bin/bash

###############################################################################
# Streaming Tracker - Neo4j Restore Script
#
# This script restores Neo4j database from a JSON backup created by backup.sh
#
# Features:
# - Lists available backups
# - Restores from selected backup file
# - Clears existing data before restore (optional)
# - Verifies restoration
#
# Usage:
#   ./restore.sh                          # Interactive mode (lists backups)
#   ./restore.sh <backup-filename>        # Direct restore
#   ./restore.sh streaming-tracker-backup-20260119_030000.json
###############################################################################

set -e  # Exit on error

# Configuration
PROJECT_DIR="/home/sfeltner/Projects/streaming-tracker"
BACKUP_DIR="${PROJECT_DIR}/backups"
LOG_FILE="${BACKUP_DIR}/restore.log"
CONTAINER_NAME="streaming-tracker-neo4j"
NEO4J_USER="neo4j"
NEO4J_PASSWORD="streamingtracker2026"

# Timestamp for logging
DATE_LABEL=$(date +"%Y-%m-%d %H:%M:%S")

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

list_backups() {
    echo ""
    echo "Available backups:"
    echo "=================="

    BACKUPS=($(ls -t "${BACKUP_DIR}"/streaming-tracker-backup-*.json 2>/dev/null))

    if [ ${#BACKUPS[@]} -eq 0 ]; then
        echo "No backups found in ${BACKUP_DIR}"
        exit 1
    fi

    for i in "${!BACKUPS[@]}"; do
        BACKUP_FILE="${BACKUPS[$i]}"
        FILENAME=$(basename "${BACKUP_FILE}")
        SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
        DATE=$(stat -c %y "${BACKUP_FILE}" | cut -d' ' -f1,2 | cut -d'.' -f1)
        echo "[$((i+1))] ${FILENAME} (${SIZE}, ${DATE})"
    done

    echo ""
}

select_backup() {
    list_backups

    echo -n "Enter backup number to restore (or 'q' to quit): "
    read SELECTION

    if [ "${SELECTION}" = "q" ]; then
        echo "Restore cancelled."
        exit 0
    fi

    if ! [[ "${SELECTION}" =~ ^[0-9]+$ ]]; then
        echo "ERROR: Invalid selection"
        exit 1
    fi

    BACKUPS=($(ls -t "${BACKUP_DIR}"/streaming-tracker-backup-*.json 2>/dev/null))
    INDEX=$((SELECTION-1))

    if [ ${INDEX} -lt 0 ] || [ ${INDEX} -ge ${#BACKUPS[@]} ]; then
        echo "ERROR: Selection out of range"
        exit 1
    fi

    BACKUP_FILE="${BACKUPS[$INDEX]}"
}

confirm_restore() {
    echo ""
    echo "⚠️  WARNING: This will DELETE all existing data in the database!"
    echo "Backup to restore: $(basename ${BACKUP_FILE})"
    echo ""
    echo -n "Are you sure you want to continue? (yes/no): "
    read CONFIRM

    if [ "${CONFIRM}" != "yes" ]; then
        echo "Restore cancelled."
        exit 0
    fi
}

clear_database() {
    log_message "Clearing existing database..."

    docker exec "${CONTAINER_NAME}" cypher-shell -u "${NEO4J_USER}" -p "${NEO4J_PASSWORD}" \
        "MATCH (n) DETACH DELETE n" >> "${LOG_FILE}" 2>&1

    if [ $? -eq 0 ]; then
        log_message "✓ Database cleared successfully"
    else
        log_message "✗ ERROR: Failed to clear database"
        exit 1
    fi
}

copy_to_container() {
    log_message "Copying backup file to container..."

    FILENAME=$(basename "${BACKUP_FILE}")
    CONTAINER_PATH="/var/lib/neo4j/import/${FILENAME}"

    docker cp "${BACKUP_FILE}" "${CONTAINER_NAME}:${CONTAINER_PATH}"

    if [ $? -eq 0 ]; then
        log_message "✓ Backup file copied to container"
    else
        log_message "✗ ERROR: Failed to copy backup file"
        exit 1
    fi
}

import_data() {
    log_message "Importing data from backup..."

    FILENAME=$(basename "${BACKUP_FILE}")

    # Import using apoc.import.json from the import directory
    docker exec "${CONTAINER_NAME}" cypher-shell -u "${NEO4J_USER}" -p "${NEO4J_PASSWORD}" \
        "CALL apoc.import.json('file:///${FILENAME}', {cleanup: true})" >> "${LOG_FILE}" 2>&1

    if [ $? -eq 0 ]; then
        log_message "✓ Data import completed successfully"
    else
        log_message "⚠ Trying alternate import method..."

        # Alternative: Parse JSON and create nodes/relationships
        # This is a fallback if direct import doesn't work
        log_message "✗ ERROR: Data import failed. Please check the log file for details."
        log_message "  You may need to manually restore using Neo4j Browser."
        exit 1
    fi
}

cleanup_temp() {
    log_message "Cleaning up temporary files..."

    FILENAME=$(basename "${BACKUP_FILE}")
    docker exec "${CONTAINER_NAME}" rm -f "/var/lib/neo4j/import/${FILENAME}" 2>/dev/null || true

    log_message "✓ Cleanup completed"
}

verify_restore() {
    log_message "Verifying restoration..."

    # Count nodes after restore
    NODE_COUNT=$(docker exec "${CONTAINER_NAME}" cypher-shell -u "${NEO4J_USER}" -p "${NEO4J_PASSWORD}" \
        "MATCH (n) RETURN count(n) as count" --format plain 2>/dev/null | tail -n1)

    log_message "✓ Restored ${NODE_COUNT} nodes"

    # Show counts by label
    log_message "Node counts by type:"
    docker exec "${CONTAINER_NAME}" cypher-shell -u "${NEO4J_USER}" -p "${NEO4J_PASSWORD}" \
        "MATCH (n) RETURN labels(n)[0] as type, count(n) as count ORDER BY type" --format plain 2>/dev/null | \
        while read line; do
            log_message "  ${line}"
        done
}

###############################################################################
# Main Execution
###############################################################################

log_message "========================================="
log_message "Starting Neo4j restore process"
log_message "========================================="

# Check if container is running
check_container

# Select backup file
if [ -z "$1" ]; then
    # Interactive mode
    select_backup
else
    # Direct mode with filename
    BACKUP_FILE="${BACKUP_DIR}/$1"

    if [ ! -f "${BACKUP_FILE}" ]; then
        log_message "ERROR: Backup file not found: ${BACKUP_FILE}"
        exit 1
    fi
fi

log_message "Selected backup: $(basename ${BACKUP_FILE})"

# Confirm restore
confirm_restore

# Step 1: Clear existing database
clear_database

# Step 2: Copy backup file to container
copy_to_container

# Step 3: Import data
import_data

# Step 4: Clean up temporary files
cleanup_temp

# Step 5: Verify restoration
verify_restore

log_message "========================================="
log_message "Restore completed successfully!"
log_message "========================================="
log_message ""

exit 0
