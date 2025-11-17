const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPORT_DIR = path.join(__dirname, '../reports');
const HTML_REPORT = path.join(REPORT_DIR, 'validation-report.html');
const JSON_REPORT = path.join(REPORT_DIR, 'validation-report.json');

// Ensure reports directory exists
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

function runCommand(command, allowFailure = false) {
  try {
    const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
    return { success: true, output: output.trim() };
  } catch (error) {
    if (allowFailure) {
      return { success: false, output: error.stdout || error.message };
    }
    return { success: false, output: error.stdout || error.message };
  }
}

function getCoverageData() {
  try {
    const coveragePath = path.join(__dirname, '../coverage/coverage-summary.json');
    if (fs.existsSync(coveragePath)) {
      const data = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));
      return {
        lines: data.total.lines.pct,
        statements: data.total.statements.pct,
        functions: data.total.functions.pct,
        branches: data.total.branches.pct,
      };
    }
  } catch (error) {
    // Coverage file might not exist
  }
  return null;
}

function generateReport() {
  const timestamp = new Date().toISOString();
  const results = {
    timestamp,
    linting: runCommand('npm run lint:check', true),
    formatting: runCommand('npm run format:check', true),
    tests: runCommand('npm test', true),
    build: runCommand('npm run build', true),
    coverage: getCoverageData(),
  };

  // Check for any violations
  const violations = [];
  if (!results.linting.success) {
    violations.push({
      type: 'Linting',
      status: 'FAILED',
      details: results.linting.output,
    });
  }
  if (!results.formatting.success) {
    violations.push({
      type: 'Formatting',
      status: 'FAILED',
      details: results.formatting.output,
    });
  }
  if (!results.tests.success) {
    violations.push({
      type: 'Tests',
      status: 'FAILED',
      details: results.tests.output,
    });
  }
  if (!results.build.success) {
    violations.push({
      type: 'Build',
      status: 'FAILED',
      details: results.build.output,
    });
  }
  if (results.coverage && results.coverage.lines < 80) {
    violations.push({
      type: 'Coverage',
      status: 'FAILED',
      details: `Coverage ${results.coverage.lines}% is below 80% threshold`,
    });
  }

  const report = {
    timestamp,
    overallStatus: violations.length === 0 ? 'PASSED' : 'FAILED',
    violations,
    results: {
      linting: {
        status: results.linting.success ? 'PASSED' : 'FAILED',
        output: results.linting.output,
      },
      formatting: {
        status: results.formatting.success ? 'PASSED' : 'FAILED',
        output: results.formatting.output,
      },
      tests: {
        status: results.tests.success ? 'PASSED' : 'FAILED',
        output: results.tests.output,
      },
      build: {
        status: results.build.success ? 'PASSED' : 'FAILED',
        output: results.build.output,
      },
      coverage: results.coverage
        ? {
            status: results.coverage.lines >= 80 ? 'PASSED' : 'FAILED',
            lines: results.coverage.lines,
            statements: results.coverage.statements,
            functions: results.coverage.functions,
            branches: results.coverage.branches,
          }
        : null,
    },
  };

  // Save JSON report
  fs.writeFileSync(JSON_REPORT, JSON.stringify(report, null, 2));

  // Generate HTML report
  const html = generateHTMLReport(report);
  fs.writeFileSync(HTML_REPORT, html);

  console.log(`\n📊 Validation Report Generated:`);
  console.log(`   Status: ${report.overallStatus}`);
  console.log(`   Violations: ${violations.length}`);
  console.log(`   HTML: ${HTML_REPORT}`);
  console.log(`   JSON: ${JSON_REPORT}\n`);

  return report;
}

function generateHTMLReport(report) {
  const statusColor = report.overallStatus === 'PASSED' ? '#10b981' : '#ef4444';
  const statusIcon = report.overallStatus === 'PASSED' ? '✅' : '❌';

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Validation Report - ${report.timestamp}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #f3f4f6;
            padding: 20px;
            color: #1f2937;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 { font-size: 28px; margin-bottom: 10px; }
        .header .timestamp { opacity: 0.9; font-size: 14px; }
        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            margin-top: 15px;
            background: ${statusColor};
            color: white;
        }
        .content { padding: 30px; }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        .summary-card h3 {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .summary-card .value {
            font-size: 32px;
            font-weight: 700;
            color: #1f2937;
        }
        .section {
            margin-bottom: 30px;
        }
        .section h2 {
            font-size: 20px;
            margin-bottom: 15px;
            color: #1f2937;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
        }
        .check-item {
            background: #f9fafb;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .check-item.passed { border-left: 4px solid #10b981; }
        .check-item.failed { border-left: 4px solid #ef4444; }
        .check-status {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        .check-status.passed {
            background: #d1fae5;
            color: #065f46;
        }
        .check-status.failed {
            background: #fee2e2;
            color: #991b1b;
        }
        .violation-details {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 15px;
            margin-top: 10px;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 12px;
            color: #991b1b;
            white-space: pre-wrap;
            overflow-x: auto;
            max-height: 300px;
            overflow-y: auto;
        }
        .coverage-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
        }
        .coverage-item {
            background: #f9fafb;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
        }
        .coverage-item .label {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 5px;
        }
        .coverage-item .percentage {
            font-size: 24px;
            font-weight: 700;
            color: #1f2937;
        }
        .footer {
            background: #f9fafb;
            padding: 20px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${statusIcon} Code Validation Report</h1>
            <div class="timestamp">Generated: ${new Date(report.timestamp).toLocaleString()}</div>
            <div class="status-badge">${report.overallStatus}</div>
        </div>
        <div class="content">
            <div class="summary">
                <div class="summary-card">
                    <h3>Overall Status</h3>
                    <div class="value" style="color: ${statusColor}">${report.overallStatus}</div>
                </div>
                <div class="summary-card">
                    <h3>Violations Found</h3>
                    <div class="value">${report.violations.length}</div>
                </div>
                <div class="summary-card">
                    <h3>Checks Performed</h3>
                    <div class="value">5</div>
                </div>
                ${report.results.coverage ? `
                <div class="summary-card">
                    <h3>Coverage</h3>
                    <div class="value">${report.results.coverage.lines.toFixed(1)}%</div>
                </div>
                ` : ''}
            </div>

            ${report.violations.length > 0 ? `
            <div class="section">
                <h2>🚨 Violations Detected</h2>
                ${report.violations
                  .map(
                    (v) => `
                <div class="check-item failed">
                    <div>
                        <strong>${v.type}</strong>
                        <div class="violation-details">${escapeHtml(v.details)}</div>
                    </div>
                    <span class="check-status failed">FAILED</span>
                </div>
                `,
                  )
                  .join('')}
            </div>
            ` : ''}

            <div class="section">
                <h2>📋 Validation Checks</h2>
                <div class="check-item ${report.results.linting.status.toLowerCase()}">
                    <span><strong>Linting</strong> - ESLint validation</span>
                    <span class="check-status ${report.results.linting.status.toLowerCase()}">${report.results.linting.status}</span>
                </div>
                <div class="check-item ${report.results.formatting.status.toLowerCase()}">
                    <span><strong>Formatting</strong> - Prettier validation</span>
                    <span class="check-status ${report.results.formatting.status.toLowerCase()}">${report.results.formatting.status}</span>
                </div>
                <div class="check-item ${report.results.tests.status.toLowerCase()}">
                    <span><strong>Tests</strong> - Jest unit tests</span>
                    <span class="check-status ${report.results.tests.status.toLowerCase()}">${report.results.tests.status}</span>
                </div>
                <div class="check-item ${report.results.build.status.toLowerCase()}">
                    <span><strong>Build</strong> - TypeScript compilation</span>
                    <span class="check-status ${report.results.build.status.toLowerCase()}">${report.results.build.status}</span>
                </div>
                ${report.results.coverage ? `
                <div class="check-item ${report.results.coverage.status.toLowerCase()}">
                    <span><strong>Coverage</strong> - Test coverage (threshold: 80%)</span>
                    <span class="check-status ${report.results.coverage.status.toLowerCase()}">${report.results.coverage.status}</span>
                </div>
                ` : ''}
            </div>

            ${report.results.coverage ? `
            <div class="section">
                <h2>📊 Coverage Details</h2>
                <div class="coverage-grid">
                    <div class="coverage-item">
                        <div class="label">Lines</div>
                        <div class="percentage">${report.results.coverage.lines.toFixed(1)}%</div>
                    </div>
                    <div class="coverage-item">
                        <div class="label">Statements</div>
                        <div class="percentage">${report.results.coverage.statements.toFixed(1)}%</div>
                    </div>
                    <div class="coverage-item">
                        <div class="label">Functions</div>
                        <div class="percentage">${report.results.coverage.functions.toFixed(1)}%</div>
                    </div>
                    <div class="coverage-item">
                        <div class="label">Branches</div>
                        <div class="percentage">${report.results.coverage.branches.toFixed(1)}%</div>
                    </div>
                </div>
            </div>
            ` : ''}
        </div>
        <div class="footer">
            Generated by SDLC1 Validation System | ${new Date(report.timestamp).toLocaleString()}
        </div>
    </div>
</body>
</html>`;
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Run if called directly
if (require.main === module) {
  const report = generateReport();
  process.exit(report.overallStatus === 'PASSED' ? 0 : 1);
}

module.exports = { generateReport };

