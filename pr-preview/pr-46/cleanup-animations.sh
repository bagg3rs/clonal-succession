#!/bin/bash

# Files to keep
KEEP_FILES=(
  "clonal-succession-cycle.html"
  "time-tracking.js"
  "animation-specs.md"
  "MOBILE_RESPONSIVE_GUIDE.md"
  "mobile-responsive.css"
  "mobile-responsive.js"
)

# Check if a file should be kept
function should_keep {
  local file="$1"
  for keep_file in "${KEEP_FILES[@]}"; do
    if [ "$file" == "$keep_file" ]; then
      return 0
    fi
  done
  return 1
}

# Count of files removed
removed_count=0

# Process each file in the animations directory
for file in animations/*; do
  filename=$(basename "$file")
  
  if should_keep "$filename"; then
    echo "Keeping: $filename"
  else
    echo "Removing: $filename"
    rm "$file"
    removed_count=$((removed_count + 1))
  fi
done

echo "Animation cleanup complete. Removed $removed_count files."