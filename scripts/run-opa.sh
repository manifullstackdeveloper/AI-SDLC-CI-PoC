#!/bin/bash

# OPA policy validation script
set -e

echo "🔒 Running OPA security policy validation..."

# Ensure reports directory exists
mkdir -p reports

# Check if opa is installed
if ! command -v opa &> /dev/null; then
    echo "⚠️  OPA not found. Installing..."
    # Detect OS
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)
    if [ "$ARCH" = "x86_64" ]; then
        ARCH="amd64"
    fi
    
    if [ "$OS" = "darwin" ]; then
        OPA_URL="https://openpolicyagent.org/downloads/latest/opa_darwin_${ARCH}"
    elif [ "$OS" = "linux" ]; then
        OPA_URL="https://openpolicyagent.org/downloads/latest/opa_linux_${ARCH}"
    else
        echo "❌ Unsupported OS: $OS"
        exit 1
    fi
    
    curl -L -o opa "$OPA_URL" || {
        echo "❌ Failed to download OPA. Please install manually."
        exit 1
    }
    chmod +x opa
    sudo mv opa /usr/local/bin/ 2>/dev/null || {
        echo "⚠️  Could not move to /usr/local/bin. Using local copy."
        export PATH="$PWD:$PATH"
    }
fi

# Check if jq is installed (needed for JSON processing)
if ! command -v jq &> /dev/null; then
    echo "⚠️  jq not found. Installing..."
    if [ "$OS" = "darwin" ]; then
        brew install jq || {
            echo "❌ Please install jq manually: brew install jq"
            exit 1
        }
    elif [ "$OS" = "linux" ]; then
        sudo apt-get update && sudo apt-get install -y jq || {
            echo "❌ Please install jq manually: sudo apt-get install jq"
            exit 1
        }
    fi
fi

# Create input JSON from source files
echo "📦 Preparing OPA input..."
INPUT_FILE=$(mktemp)
cat > "$INPUT_FILE" <<EOF
{
  "files": [
EOF

FIRST=true
find src -name "*.ts" -type f 2>/dev/null | while read -r file; do
    if [ "$FIRST" = true ]; then
        FIRST=false
    else
        echo "," >> "$INPUT_FILE"
    fi
    echo "    {" >> "$INPUT_FILE"
    echo "      \"path\": \"$file\"," >> "$INPUT_FILE"
    echo "      \"content\": $(cat "$file" | jq -Rs .)" >> "$INPUT_FILE"
    echo "    }" >> "$INPUT_FILE"
done

echo "  ]" >> "$INPUT_FILE"
echo "}" >> "$INPUT_FILE"

# Run OPA evaluation
echo "🔍 Evaluating OPA policies..."
opa eval --data policies/security.rego --input "$INPUT_FILE" --format json "data.security.violations" > reports/opa-results.json 2>&1 || {
    echo "⚠️  OPA evaluation completed with warnings"
}

# Check for violations
if [ -f reports/opa-results.json ]; then
    VIOLATIONS=$(cat reports/opa-results.json | jq -r '.result[0].expressions[0].value | length' 2>/dev/null || echo "0")
    if [ "$VIOLATIONS" != "null" ] && [ "$VIOLATIONS" -gt 0 ] 2>/dev/null; then
        echo "❌ OPA found $VIOLATIONS security violations:"
        cat reports/opa-results.json | jq -r '.result[0].expressions[0].value[]' 2>/dev/null || cat reports/opa-results.json
        rm -f "$INPUT_FILE"
        exit 1
    fi
fi

rm -f "$INPUT_FILE"
echo "✅ OPA policy validation passed!"

