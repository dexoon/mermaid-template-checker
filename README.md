# Mermaid Template Checker

A Deno-based tool for validating Mermaid diagrams in Markdown files against syntax rules.

## Features

- Validates Mermaid diagram syntax in Markdown files
- Checks for proper code block formatting
- Validates diagram types (flowchart, sequenceDiagram, classDiagram, etc.)
- Detects syntax errors like mismatched brackets and braces
- Identifies empty Mermaid blocks
- Processes entire directories of Markdown files
- Available as a Docker container for easy deployment

## Usage

### Pre-commit Hook Setup

To automatically validate mermaid diagrams before each commit:

```bash
# Run the setup script (recommended)
./scripts/setup-pre-commit.sh

# Or manually install pre-commit and configure hooks
pip install pre-commit
pre-commit install
```

The pre-commit hook will:
- Run automatically on markdown files before each commit
- Validate all mermaid diagrams in the repository
- Prevent commits if validation errors are found

To run the pre-commit check manually:
```bash
pre-commit run --all-files
```

### Local Development

#### Check a single directory
```bash
deno run --allow-read main.ts <directory_path>
```

#### Examples
```bash
# Check correct examples
deno run --allow-read main.ts tests/correct

# Check incorrect examples
deno run --allow-read main.ts tests/incorrect
```

#### Run tests
```bash
deno test --allow-read
```

### Docker Usage

#### Build and run locally
```bash
# Build the image
docker build -t mermaid-checker .

# Run against a directory
docker run -v /path/to/your/md/files:/data mermaid-checker

# Run against test files
docker run -v $(pwd)/tests:/data mermaid-checker
```

#### Using Docker Compose
```bash
# Test all files
docker-compose --profile test up

# Test only correct files
docker-compose --profile test-correct up

# Test only incorrect files
docker-compose --profile test-incorrect up
```

#### Using GitHub Container Registry
```bash
# Pull the latest image
docker pull ghcr.io/dexoon/mermaid-template-checker:main

# Run the container
docker run -v /path/to/your/md/files:/data ghcr.io/dexoon/mermaid-template-checker:main
```

## Using as a Pre-commit Hook in Your Project

To use the mermaid template checker in your own project, add the following to your `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: https://github.com/dexoon/mermaid-template-checker
    rev: v0.1.1  # Use the latest release tag, not 'latest'
    hooks:
      # Option 1: Check all markdown files in the repository
      - id: mermaid-checker
        # args: ["<folder>"]  # Replace <folder> with the directory you want to check
        args: ["."]
      
      # Option 2: Check only staged markdown files (faster)
      # - id: mermaid-checker-staged
      #   args: ["."]
```

Then run:

```bash
pip install pre-commit
pre-commit install
```

This will ensure all your markdown files are checked before each commit.

### Troubleshooting

If you see `(no files to check)`, it means:
- No markdown files are staged for commit, OR
- No markdown files exist in the repository

**Solutions:**
1. **Make sure you have markdown files**: Create a `.md` file with mermaid diagrams
2. **Stage your files**: Run `git add .` before committing
3. **Use the staged-only hook**: Uncomment the `mermaid-checker-staged` option above for faster checks

---

## Test Structure

The repository includes test folders with example files:

- `tests/correct/` - Contains valid Mermaid diagrams
- `tests/incorrect/` - Contains invalid Mermaid diagrams for testing error detection

## CI/CD

This project includes GitHub Actions workflows for:

- **Testing**: Runs tests on every push and pull request
- **Docker Build**: Builds and pushes Docker images to GitHub Container Registry (GHCR)
- **Coverage**: Generates and uploads test coverage reports

### GitHub Container Registry

Images are automatically built and pushed to GHCR on:
- Every push to main branch
- Every tag push (for versioned releases)

The image can be found at: `ghcr.io/dexoon/mermaid-template-checker`

## Validation Rules

The checker validates flowcharts according to specific template rules:

### Structure
1. **Sections**: Each flowchart must have two sections in order:
   - `%% Node Definitions` - defines all nodes
   - `%% Connections` - defines all connections between nodes

### Node Types
2. **Node Definitions**: Each node must use specific syntax:
   - **Rectangled-circle**: `NODE_ID("Label")` - for initial nodes
   - **Rectangle**: `NODE_ID["Label"]` - for user messages, buttons, or text
   - **Diamond**: `NODE_ID{"Label"}` - for conditions or branching
   - **Circle**: `NODE_ID(("Label"))` - for transitions to other FSM modules
   - **Hexagon**: `NODE_ID{{"Label"}}` - for explicit branching/choice points
   - **Parallelogram**: `NODE_ID[/"Label"/]` - for function calls

### Node Content Rules
3. **Node Labels**: Must follow specific content structure:
   - **Labels must be in double quotes**: All node labels must be properly quoted
   - **Multi-line support**: Labels can span multiple lines with real line breaks
   - **No `\n` characters**: Use actual line breaks in the diagram code

### Rectangle Node Rules
4. **Rectangle Nodes** (message templates) have 3 parts (some optional):
   - **Text/caption**: `/my text/` (can contain `{$variables}` and `((templates))`)
   - **Media description**: `//photo of me//`
   - **Buttons**: `[inline]` or `[[reply]]` (can contain both types)
   - **At least one required**: Either text or media must be present (buttons are optional)

### Connections
5. **Connection Syntax**: Must use `FROM_NODE == "User action" ==> TO_NODE` or `FROM_NODE -- "User action" --> TO_NODE`
6. **Arrow Types**:
   - `==` with `==>` - for sending new messages
   - `--` with `-->` - for editing previous messages
7. **Comment Formats**:
   - Button: `[Button Text]`
   - Media: `//photo//`, `//video//`
   - Text: Plain text in double quotes
8. **No mixing arrow types**: For a given user action between two nodes, you cannot use both `==` and `--` arrows for the same comment

### Validation
9. **Node References**: All connections must reference defined nodes
10. **Diagram Type**: Only flowcharts are validated
11. **Section Order**: Node Definitions must come before Connections
12. **Content Placement**: Connection syntax is not allowed in Node Definitions section

## Output

The tool provides:
- ✅ Valid files with no errors
- ❌ Invalid files with specific error messages
- Detailed error descriptions for each issue found