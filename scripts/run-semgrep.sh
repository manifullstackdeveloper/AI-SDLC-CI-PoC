#!/bin/bash

# Semgrep validation script
# Don't use set -e here, we'll handle errors manually

echo "🔍 Running Semgrep security scan..."
echo ""

# Ensure reports directory exists
mkdir -p reports

SEMREGREP_CMD=(semgrep)
PYTHON_RUNNER=()

# Check if semgrep is installed
if ! command -v semgrep &> /dev/null; then
    echo "⚠️  Semgrep not found. Installing..."
    if command -v python3 &> /dev/null; then
        PYTHON_RUNNER=(python3)
    elif command -v python &> /dev/null; then
        PYTHON_RUNNER=(python)
    elif command -v py &> /dev/null; then
        PYTHON_RUNNER=(py -3)
    fi
    if [ "${#PYTHON_RUNNER[@]}" -gt 0 ]; then
        "${PYTHON_RUNNER[@]}" -m pip install semgrep
    elif command -v pip3 &> /dev/null; then
        pip3 install semgrep
    elif command -v pip &> /dev/null; then
        pip install semgrep
    else
        echo "❌ Python/pip not installed; please install Python or Semgrep manually."
        exit 1
    fi
    if command -v semgrep &> /dev/null; then
        SEMREGREP_CMD=(semgrep)
    elif [ "${#PYTHON_RUNNER[@]}" -gt 0 ]; then
        SEMREGREP_CMD=("${PYTHON_RUNNER[@]}" -m semgrep)
    else
        echo "❌ Semgrep installation still failed. Please install manually (python -m pip install semgrep)"
        exit 1
    fi
fi

# Run Semgrep scan and capture output (don't fail on warnings)
("${SEMREGREP_CMD[@]}" --config=.semgrep.yml --json --output=reports/semgrep-results.json src/ 2>&1) || true

# Check if there are ERROR level findings
ERROR_OUTPUT=$("${SEMREGREP_CMD[@]}" --config=.semgrep.yml --severity=ERROR src/ 2>&1 || true)

# Check for findings (macOS compatible)
# Only fail if there are actual blocking findings (not 0 findings)
BLOCKING_FINDINGS=$(echo "$ERROR_OUTPUT" | grep -oE "\([0-9]+ blocking\)" | grep -oE "[0-9]+" || echo "0")
TOTAL_FINDINGS=$(echo "$ERROR_OUTPUT" | grep -oE "Findings: [0-9]+" | grep -oE "[0-9]+" || echo "0")

# Check if we have actual blocking findings
if [ "$BLOCKING_FINDINGS" -gt 0 ]; then
    echo "❌ Semgrep found ERROR level security issues:"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    # Show findings with file and line info
    "${SEMREGREP_CMD[@]}" --config=.semgrep.yml --severity=ERROR src/ 2>&1 | grep -E "(Code Finding|❯❯❱|┆|\.ts:|\.js:)" | head -30
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📋 Detailed report saved to: reports/semgrep-results.json"
    echo ""
    echo "💡 How to fix:"
    echo "   1. Review the errors above (shows file, line number, and issue)"
    echo "   2. Check detailed JSON report:"
    echo "      cat reports/semgrep-results.json | jq '.results[] | {rule_id, message, path, line: .start.line}'"
    echo "   3. See SEMGREP-FIXES.md for common fixes and examples"
    echo "   4. See DEVELOPER-GUIDE.md for step-by-step instructions"
    echo "   5. Fix the issues and try committing again"
    echo ""
    exit 1
fi

# Check for warnings (non-blocking)
WARNING_OUTPUT=$("${SEMREGREP_CMD[@]}" --config=.semgrep.yml --severity=WARNING src/ 2>&1 || true)
if echo "$WARNING_OUTPUT" | grep -q "WARNING"; then
    echo "⚠️  Semgrep found warnings (non-blocking):"
    echo "$WARNING_OUTPUT" | grep -A 3 "WARNING" | head -20
    echo ""
    echo "💡 Consider fixing warnings. See reports/semgrep-results.json for details"
    echo ""
fi

echo "✅ Semgrep scan passed!"

