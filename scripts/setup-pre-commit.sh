#!/bin/bash

# Setup script for pre-commit hooks with mermaid template checker

set -e

echo "Setting up pre-commit hooks for mermaid template checker..."

# Check if pre-commit is installed
if ! command -v pre-commit &> /dev/null; then
    echo "Installing pre-commit..."
    if command -v pip &> /dev/null; then
        pip install pre-commit
    elif command -v pip3 &> /dev/null; then
        pip3 install pre-commit
    else
        echo "Error: pip or pip3 not found. Please install Python and pip first."
        exit 1
    fi
fi

# Check if Deno is installed
if ! command -v deno &> /dev/null; then
    echo "Error: Deno not found. Please install Deno first."
    echo "Visit https://deno.land/#installation for installation instructions."
    exit 1
fi

# Install the pre-commit hooks
echo "Installing pre-commit hooks..."
pre-commit install

echo "✅ Pre-commit hooks installed successfully!"
echo ""
echo "The mermaid template checker will now run automatically on markdown files before each commit."
echo ""
echo "To test the setup, try making a commit with a markdown file containing mermaid diagrams."
echo ""
echo "To run the checker manually:"
echo "  deno run --allow-read main.ts ."
echo ""
echo "To run pre-commit on all files:"
echo "  pre-commit run --all-files" 