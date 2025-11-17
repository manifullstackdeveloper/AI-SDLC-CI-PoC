# AI Usage Tracking & Reporting

## Overview

Comprehensive AI usage tracking system that captures model information, token usage, file modifications, and generates audit reports for compliance and cost analysis.

## Features

- ✅ **Automatic Tracking**: Captures AI usage on every commit via git hooks
- ✅ **Model Detection**: Identifies AI tool (Cursor, Claude Code, GitHub Copilot)
- ✅ **Token Tracking**: Records input/output tokens for cost analysis
- ✅ **File Attribution**: Tracks which files were modified by AI
- ✅ **Audit Trail**: Complete history of AI-generated code
- ✅ **Usage Reports**: HTML and JSON reports with metrics and analytics

## Quick Start

### Automatic Tracking

AI usage is automatically tracked when you commit code:

```bash
git add .
git commit -m "Add new feature"
# AI usage automatically tracked!
```

### Manual Tracking

Track AI usage manually with specific model information:

```bash
# Track with model info
npm run ai:track -- --model claude-3-opus --input-tokens 1500 --output-tokens 800

# Or use environment variables
export CURSOR_SESSION_ID=xxx
npm run ai:track
```

### Generate Reports

```bash
# Generate AI usage report
npm run ai:report
```

Opens `reports/ai-usage-report.html` with comprehensive metrics.

## Configuration

### Environment Variables

The system auto-detects AI tools from environment variables:

- **Cursor**: `CURSOR_SESSION_ID`, `CURSOR_VERSION`
- **Claude Code**: `CLAUDE_SESSION_ID`, `ANTHROPIC_API_KEY`
- **GitHub Copilot**: `GITHUB_COPILOT`, `COPILOT_SESSION`

### Git Configuration

Set default AI tool and model:

```bash
git config ai.tool "Cursor"
git config ai.model "claude-3-opus"
```

## Report Contents

### Summary Metrics

- **Total Sessions**: Number of AI generation events
- **Total Tokens**: Cumulative token usage (input + output)
- **Total Files**: Files modified by AI
- **Average Tokens/Session**: Cost analysis metric

### Usage Breakdown

- **By AI Tool**: Cursor, Claude Code, GitHub Copilot
- **By Model**: Specific model usage (e.g., claude-3-opus, gpt-4)
- **By User**: Per-developer usage statistics
- **By Date**: Daily usage trends

### File Analytics

- **Most Modified Files**: Files frequently changed by AI
- **File Modification Count**: How many times each file was AI-modified
- **Token Usage per File**: Cost attribution by file

### Audit Trail

- **Recent Sessions**: Last 50 AI generation events
- **Session Details**: Timestamp, tool, model, tokens, files, commit hash
- **User Attribution**: Who generated the code

## Data Storage

AI usage data is stored in `.ai-usage/usage.json`:

```json
{
  "sessions": [
    {
      "id": "session-1234567890-abc123",
      "timestamp": "2025-01-15T10:30:00.000Z",
      "tool": "Cursor",
      "model": "claude-3-opus",
      "tokens": {
        "input": 1500,
        "output": 800,
        "total": 2300
      },
      "files": [
        {
          "path": "src/items/items.service.ts",
          "lines": 150,
          "size": 4500,
          "modified": "2025-01-15T10:30:00.000Z"
        }
      ],
      "commit": "abc123def456",
      "branch": "main",
      "userId": "developer1"
    }
  ],
  "summary": {
    "totalSessions": 42,
    "totalTokens": 125000,
    "totalInputTokens": 75000,
    "totalOutputTokens": 50000,
    "totalFiles": 150,
    "byTool": {
      "Cursor": {
        "sessions": 30,
        "tokens": 90000,
        "files": 100
      }
    },
    "byModel": {
      "claude-3-opus": {
        "sessions": 25,
        "tokens": 80000
      }
    },
    "byUser": {
      "developer1": {
        "sessions": 20,
        "tokens": 60000
      }
    }
  }
}
```

## CI/CD Integration

AI usage reports are automatically generated in CI pipelines:

- **Location**: GitHub Actions artifacts
- **Retention**: 30 days
- **Reports**: HTML and JSON formats
- **Data**: Complete `.ai-usage/` directory uploaded

## Usage Examples

### Track Specific Model Usage

```bash
npm run ai:track -- --model gpt-4 --input-tokens 2000 --output-tokens 1200 --tool "GitHub Copilot"
```

### View Current Usage

```bash
# Generate and open report
npm run ai:report
open reports/ai-usage-report.html
```

### Export Usage Data

```bash
# Copy usage data
cp .ai-usage/usage.json usage-export.json

# Or view raw JSON
cat .ai-usage/usage.json | jq
```

## Cost Analysis

Use token counts to estimate costs:

```javascript
// Example cost calculation
const inputTokens = 75000;
const outputTokens = 50000;
const inputCostPer1k = 0.015; // $0.015 per 1k input tokens
const outputCostPer1k = 0.075; // $0.075 per 1k output tokens

const totalCost = (inputTokens / 1000) * inputCostPer1k + (outputTokens / 1000) * outputCostPer1k;

console.log(`Estimated cost: $${totalCost.toFixed(2)}`);
```

## Privacy & Security

- **Local Storage**: Usage data stored locally in `.ai-usage/`
- **Git Tracking**: Data can be committed for team audit (optional)
- **No External Calls**: All tracking is local, no API calls made
- **User Attribution**: Uses system username (can be overridden)

## Troubleshooting

### No AI Tool Detected

If tool detection fails, manually specify:

```bash
npm run ai:track -- --model claude-3-opus --tool "Cursor"
```

### Missing Token Information

Token tracking requires manual input or API integration. Current implementation tracks:

- Files modified
- Commit information
- Timestamps
- Tool/model detection

For accurate token counts, integrate with AI tool APIs or manually track.

### Report Not Generating

Check if usage data exists:

```bash
ls -la .ai-usage/usage.json
cat .ai-usage/usage.json
```

If empty, track some usage first:

```bash
npm run ai:track
npm run ai:report
```

## Best Practices

1. **Regular Reports**: Generate reports weekly for cost tracking
2. **Commit Data**: Consider committing `.ai-usage/` for team visibility
3. **Token Tracking**: Manually track tokens for accurate cost analysis
4. **Model Documentation**: Document which models are approved for use
5. **Audit Reviews**: Review AI usage reports in code reviews

## Integration with Other Tools

### Cursor IDE

Cursor automatically sets `CURSOR_SESSION_ID` environment variable. Tracking works automatically.

### Claude Code

Set `CLAUDE_SESSION_ID` or `ANTHROPIC_API_KEY` for auto-detection.

### GitHub Copilot

Set `GITHUB_COPILOT` environment variable for detection.

### Custom Integration

Extend `scripts/track-ai-usage.js` to integrate with your AI tool's API for automatic token tracking.

## API Reference

### trackUsage(options)

```javascript
const { trackUsage } = require('./scripts/track-ai-usage');

trackUsage({
  model: 'claude-3-opus',
  tool: 'Cursor',
  inputTokens: 1500,
  outputTokens: 800,
  files: ['src/items/items.service.ts'],
  prompt: 'Generate CRUD service',
  userId: 'developer1',
});
```

### generateAIUsageReport()

```javascript
const { generateAIUsageReport } = require('./scripts/generate-ai-usage-report');

const report = generateAIUsageReport();
console.log(report.summary.totalTokens);
```

## Support

For issues or questions:

1. Check `.ai-usage/usage.json` for data
2. Review `reports/ai-usage-report.html` for metrics
3. Check git hooks are installed: `ls -la .husky/`
