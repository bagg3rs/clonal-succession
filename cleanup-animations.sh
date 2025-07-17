#!/bin/bash

# Cleanup script for animations folder
# This script removes redundant or experimental animations while keeping essential files

echo "Starting animations folder cleanup..."

# Create backup directory
BACKUP_DIR="animations_backup_$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Copy all animation files to backup
echo "Creating backup in $BACKUP_DIR..."
cp -r animations/* $BACKUP_DIR/

# Essential files to keep
ESSENTIAL_FILES=(
  "clonal-succession-cycle.html"  # Main simulation
  "mobile-responsive.css"         # Mobile responsiveness CSS
  "mobile-responsive.js"          # Mobile responsiveness JS
  "time-tracking.js"              # Time tracking functionality
  "MOBILE_RESPONSIVE_GUIDE.md"    # Documentation for mobile responsiveness
  "animation-specs.md"            # Animation specifications
)

# Files to remove (experimental or redundant animations)
REMOVE_FILES=(
  "bulletproof-tight-simulation.html"
  "clean-division.html"
  "clean-physics-simulation.html"
  "cohesive-slow-expansion.html"
  "contained-simulation.html"
  "current-simulation.html"
  "expanding-cage-simulation.html"
  "fluid-simulation.html"
  "gentle-division.html"
  "gradual-expansion-simulation.html"
  "improved-simulation.html"
  "max-cells-control-simulation.html"
  "natural-movement-simulation.html"
  "physics-simulation.html"
  "popping-clinging.html"
  "realistic-division.html"
  "red-white-cycle.html"
  "responsive-expansion-simulation.html"
  "tight-packed-simulation.html"
  "tight-start-simulation.html"
  "ultra-tight-simulation.html"
  "unlimited-division-simulation.html"
)

# Create a temporary directory for essential files
mkdir -p temp_animations

# Copy essential files to temporary directory
for file in "${ESSENTIAL_FILES[@]}"; do
  if [ -f "animations/$file" ]; then
    echo "Keeping essential file: $file"
    cp "animations/$file" "temp_animations/"
  else
    echo "Warning: Essential file $file not found!"
  fi
done

# Remove the animations directory and replace with temporary directory
rm -rf animations
mv temp_animations animations

echo "Cleanup complete!"
echo "Removed ${#REMOVE_FILES[@]} redundant or experimental animation files"
echo "Kept ${#ESSENTIAL_FILES[@]} essential files"
echo "Backup of all original files is available in $BACKUP_DIR"