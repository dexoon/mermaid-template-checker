#!/bin/bash

# Mermaid Template Checker Docker Runner
# Usage: ./scripts/check-mermaid.sh <directory_path>

set -e

# Default values
IMAGE_NAME="mermaid-checker"
CONTAINER_NAME="mermaid-checker-temp"

# Function to show usage
show_usage() {
    echo "Usage: $0 <directory_path>"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -i, --image    Specify custom image name (default: mermaid-checker)"
    echo ""
    echo "Examples:"
    echo "  $0 ./docs"
    echo "  $0 -i ghcr.io/username/mermaid-template-checker:main ./docs"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -i|--image)
            IMAGE_NAME="$2"
            shift 2
            ;;
        *)
            DIRECTORY="$1"
            shift
            ;;
    esac
done

# Check if directory is provided
if [[ -z "$DIRECTORY" ]]; then
    echo "Error: Directory path is required"
    show_usage
    exit 1
fi

# Check if directory exists
if [[ ! -d "$DIRECTORY" ]]; then
    echo "Error: Directory '$DIRECTORY' does not exist"
    exit 1
fi

# Get absolute path
DIRECTORY=$(realpath "$DIRECTORY")

echo "🔍 Checking Mermaid files in: $DIRECTORY"
echo "🐳 Using image: $IMAGE_NAME"
echo ""

# Run the container
docker run --rm \
    -v "$DIRECTORY:/data" \
    --name "$CONTAINER_NAME" \
    "$IMAGE_NAME"

echo ""
echo "✅ Check completed!" 