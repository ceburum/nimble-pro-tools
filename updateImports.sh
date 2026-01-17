#!/bin/bash
# Replace all imports of the old file name with the corrected one

# Old import
OLD='supabaseClieant'
# New import
NEW='supabaseClient'

# Find and replace in all .ts and .tsx files under src
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s/$OLD/$NEW/g" {} +
echo "Imports updated from $OLD to $NEW"
