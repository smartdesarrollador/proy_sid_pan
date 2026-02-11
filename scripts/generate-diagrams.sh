#!/bin/bash
# Generate UML diagrams from PlantUML files

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}UML Diagram Generator${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if plantuml is installed
if ! command -v plantuml &> /dev/null; then
    echo -e "${YELLOW}PlantUML not found. Installing...${NC}"

    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "Detected Linux. Install with: sudo apt-get install plantuml"
        echo "Or download from: https://plantuml.com/download"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Detected macOS. Install with: brew install plantuml"
    else
        echo "Please install PlantUML manually: https://plantuml.com/download"
    fi

    echo -e "${RED}Exiting. Please install PlantUML and try again.${NC}"
    exit 1
fi

# Check if Java is installed (required by PlantUML)
if ! command -v java &> /dev/null; then
    echo -e "${RED}Java not found. PlantUML requires Java Runtime.${NC}"
    echo "Install Java: sudo apt-get install default-jre"
    exit 1
fi

echo -e "${GREEN}✓ PlantUML found: $(plantuml -version | head -n1)${NC}"
echo ""

# Find all .puml files in docs/architecture
DIAGRAM_DIR="docs/architecture"
PUML_FILES=$(find "$DIAGRAM_DIR" -name "*.puml" 2>/dev/null)

if [ -z "$PUML_FILES" ]; then
    echo -e "${YELLOW}No .puml files found in $DIAGRAM_DIR${NC}"
    exit 0
fi

# Generate diagrams
echo -e "${GREEN}Generating diagrams...${NC}"
echo ""

for puml_file in $PUML_FILES; do
    filename=$(basename "$puml_file" .puml)
    dirname=$(dirname "$puml_file")

    echo -e "Processing: ${YELLOW}$puml_file${NC}"

    # Generate PNG
    echo -n "  → PNG... "
    if plantuml "$puml_file" -o "$dirname" 2>/dev/null; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
    fi

    # Generate SVG (vector, better quality)
    echo -n "  → SVG... "
    if plantuml -tsvg "$puml_file" -o "$dirname" 2>/dev/null; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
    fi

    echo ""
done

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Generation complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Generated files:"
find "$DIAGRAM_DIR" -name "*.png" -o -name "*.svg" | while read file; do
    echo "  • $file"
done
echo ""
echo -e "${YELLOW}Tip: SVG files are vector graphics (scalable, better for documentation)${NC}"
echo -e "${YELLOW}Tip: PNG files are raster graphics (good for presentations)${NC}"
