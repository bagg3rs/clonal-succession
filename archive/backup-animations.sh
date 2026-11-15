#!/bin/bash

# Create a backup directory with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="animations_backup_$TIMESTAMP"

# Create the backup directory
mkdir -p "$BACKUP_DIR"

# Copy all files from animations folder to backup
cp -r animations/* "$BACKUP_DIR"

echo "Backup of animations folder created in $BACKUP_DIR"