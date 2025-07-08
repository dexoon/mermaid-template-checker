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