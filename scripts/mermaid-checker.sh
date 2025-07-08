#!/bin/bash

# Mermaid Template Checker Pre-commit Hook
# This script downloads and runs the mermaid checker from the repository

set -e

# Get the directory where this script is located (the repository root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

# Check if main.ts exists in the repository
if [ ! -f "$REPO_ROOT/main.ts" ]; then
    echo "Error: main.ts not found in $REPO_ROOT"
    exit 1
fi

# Run the mermaid checker
cd "$REPO_ROOT"
deno run --allow-read main.ts "$@" 