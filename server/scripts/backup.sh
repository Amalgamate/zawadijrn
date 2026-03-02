#!/bin/bash

# Configuration
BACKUP_DIR="/backups"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-zawadi_sms}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Starting backup of ${DB_NAME}..."

# Perform backup
pg_dump -U "$DB_USER" -d "$DB_NAME" -f "$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
  echo "Backup successfully created: ${BACKUP_FILE}"
  # Compress backup
  gzip "$BACKUP_FILE"
  echo "Backup compressed: ${BACKUP_FILE}.gz"
  
  # Delete backups older than 30 days
  find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +30 -delete
  echo "Old backups cleaned up."
else
  echo "Error: Backup failed."
  exit 1
fi
