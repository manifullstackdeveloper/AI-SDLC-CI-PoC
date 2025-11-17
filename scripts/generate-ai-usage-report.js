#!/usr/bin/env node

/**
 * AI Usage Report Generator
 * Generates comprehensive HTML and JSON reports for AI usage tracking
 */

const fs = require('fs');
const path = require('path');
const { trackUsage, loadUsageData } = require('./track-ai-usage');

const REPORT_DIR = path.join(__dirname, '../reports');
const HTML_REPORT = path.join(REPORT_DIR, 'ai-usage-report.html');
const JSON_REPORT = path.join(REPORT_DIR, 'ai-usage-report.json');

// Ensure reports directory exists
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

/**
 * Generate AI usage report
 */
function generateAIUsageReport() {
  const data = loadUsageData();
  const timestamp = new Date().toISOString();

  if (!data.sessions || data.sessions.length === 0) {
    const emptyReport = {
      timestamp,
      message: 'No AI usage data found',
      summary: {
        totalSessions: 0,
        totalTokens: 0,
        totalFiles: 0,
      },
      sessions: [],
    };

    fs.writeFileSync(JSON_REPORT, JSON.stringify(emptyReport, null, 2));
    
    const html = generateEmptyHTMLReport(emptyReport);
    fs.writeFileSync(HTML_REPORT, html);

    console.log('\n📊 AI Usage Report Generated (No data found)');
    console.log(`   HTML: ${HTML_REPORT}`);
    console.log(`   JSON: ${JSON_REPORT}\n`);

    return emptyReport;
  }

  // Calculate additional metrics
  const metrics = {
    totalSessions: data.summary.totalSessions || 0,
    totalTokens: data.summary.totalTokens || 0,
    totalInputTokens: data.summary.totalInputTokens || 0,
    totalOutputTokens: data.summary.totalOutputTokens || 0,
    totalFiles: data.summary.totalFiles || 0,
    byTool: data.summary.byTool || {},
    byModel: data.summary.byModel || {},
    byUser: data.summary.byUser || {},
    averageTokensPerSession: data.summary.totalSessions > 0 
      ? data.summary.totalTokens / data.summary.totalSessions 
      : 0,
    averageFilesPerSession: data.summary.totalSessions > 0
      ? data.summary.totalFiles / data.summary.totalSessions
      : 0,
    sessionsByDate: {},
    tokensByDate: {},
  };

  // Group by date
  data.sessions.forEach(session => {
    const date = session.timestamp.split('T')[0];
    if (!metrics.sessionsByDate[date]) {
      metrics.sessionsByDate[date] = 0;
      metrics.tokensByDate[date] = 0;
    }
    metrics.sessionsByDate[date]++;
    metrics.tokensByDate[date] += session.tokens.total;
  });

  // Get recent sessions (last 50)
  const recentSessions = data.sessions.slice(-50).reverse();

  // Get top files by modification count
  const fileCounts = {};
  data.sessions.forEach(session => {
    session.files.forEach(file => {
      if (!fileCounts[file.path]) {
        fileCounts[file.path] = { count: 0, totalTokens: 0 };
      }
      fileCounts[file.path].count++;
      fileCounts[file.path].totalTokens += session.tokens.total;
    });
  });

  const topFiles = Object.entries(fileCounts)
    .map(([path, stats]) => ({ path, ...stats }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const report = {
    timestamp,
    summary: metrics,
    topFiles,
    recentSessions,
    allSessions: data.sessions,
    byTool: metrics.byTool,
    byModel: metrics.byModel,
    byUser: metrics.byUser,
  };

  // Save JSON report
  fs.writeFileSync(JSON_REPORT, JSON.stringify(report, null, 2));

  // Generate HTML report
  const html = generateHTMLReport(report);
  fs.writeFileSync(HTML_REPORT, html);

  console.log('\n📊 AI Usage Report Generated:');
  console.log(`   Total Sessions: ${metrics.totalSessions}`);
  console.log(`   Total Tokens: ${metrics.totalTokens.toLocaleString()}`);
  console.log(`   Total Files: ${metrics.totalFiles}`);
  console.log(`   HTML: ${HTML_REPORT}`);
  console.log(`   JSON: ${JSON_REPORT}\n`);

  return report;
}

/**
 * Generate HTML report
 */
function generateHTMLReport(report) {
  const { summary, topFiles, recentSessions, byTool, byModel, byUser } = report;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Usage Report - ${new Date(report.timestamp).toLocaleString()}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #f3f4f6;
            padding: 20px;
            color: #1f2937;
        }
        .container {
            max-width: 1400px;
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
        .content { padding: 30px; }
        .summary-grid {
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
        .summary-card .sub-value {
            font-size: 14px;
            color: #6b7280;
            margin-top: 5px;
        }
        .section {
            margin-bottom: 40px;
        }
        .section h2 {
            font-size: 20px;
            margin-bottom: 15px;
            color: #1f2937;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        .table th {
            background: #f9fafb;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #374151;
            border-bottom: 2px solid #e5e7eb;
        }
        .table td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        .table tr:hover {
            background: #f9fafb;
        }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        .badge-cursor { background: #dbeafe; color: #1e40af; }
        .badge-claude { background: #fce7f3; color: #9f1239; }
        .badge-copilot { background: #f0fdf4; color: #166534; }
        .badge-unknown { background: #f3f4f6; color: #6b7280; }
        .token-count {
            font-family: 'Monaco', 'Courier New', monospace;
            font-weight: 600;
            color: #059669;
        }
        .file-path {
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 12px;
            color: #6b7280;
        }
        .chart-bar {
            background: #667eea;
            height: 20px;
            border-radius: 4px;
            margin-top: 5px;
        }
        .footer {
            background: #f9fafb;
            padding: 20px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
        }
        .empty-state {
            text-align: center;
            padding: 40px;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 AI Usage Report</h1>
            <div class="timestamp">Generated: ${new Date(report.timestamp).toLocaleString()}</div>
        </div>
        <div class="content">
            <div class="summary-grid">
                <div class="summary-card">
                    <h3>Total Sessions</h3>
                    <div class="value">${summary.totalSessions.toLocaleString()}</div>
                    <div class="sub-value">AI generation events</div>
                </div>
                <div class="summary-card">
                    <h3>Total Tokens</h3>
                    <div class="value">${summary.totalTokens.toLocaleString()}</div>
                    <div class="sub-value">Input: ${summary.totalInputTokens.toLocaleString()} | Output: ${summary.totalOutputTokens.toLocaleString()}</div>
                </div>
                <div class="summary-card">
                    <h3>Total Files</h3>
                    <div class="value">${summary.totalFiles.toLocaleString()}</div>
                    <div class="sub-value">Files modified</div>
                </div>
                <div class="summary-card">
                    <h3>Avg Tokens/Session</h3>
                    <div class="value">${Math.round(summary.averageTokensPerSession).toLocaleString()}</div>
                    <div class="sub-value">Per generation</div>
                </div>
            </div>

            ${Object.keys(byTool).length > 0 ? `
            <div class="section">
                <h2>📊 Usage by AI Tool</h2>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Tool</th>
                            <th>Sessions</th>
                            <th>Tokens</th>
                            <th>Files</th>
                            <th>Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(byTool)
                          .sort((a, b) => b[1].tokens - a[1].tokens)
                          .map(([tool, stats]) => {
                            const percentage = ((stats.tokens / summary.totalTokens) * 100).toFixed(1);
                            const badgeClass = tool.toLowerCase().includes('cursor') ? 'badge-cursor' :
                                             tool.toLowerCase().includes('claude') ? 'badge-claude' :
                                             tool.toLowerCase().includes('copilot') ? 'badge-copilot' : 'badge-unknown';
                            return `
                        <tr>
                            <td><span class="badge ${badgeClass}">${escapeHtml(tool)}</span></td>
                            <td>${stats.sessions.toLocaleString()}</td>
                            <td class="token-count">${stats.tokens.toLocaleString()}</td>
                            <td>${stats.files.toLocaleString()}</td>
                            <td>
                                ${percentage}%
                                <div class="chart-bar" style="width: ${percentage}%"></div>
                            </td>
                        </tr>
                            `;
                          }).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}

            ${Object.keys(byModel).length > 0 ? `
            <div class="section">
                <h2>🧠 Usage by Model</h2>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Model</th>
                            <th>Sessions</th>
                            <th>Tokens</th>
                            <th>Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(byModel)
                          .sort((a, b) => b[1].tokens - a[1].tokens)
                          .map(([model, stats]) => {
                            const percentage = ((stats.tokens / summary.totalTokens) * 100).toFixed(1);
                            return `
                        <tr>
                            <td><strong>${escapeHtml(model)}</strong></td>
                            <td>${stats.sessions.toLocaleString()}</td>
                            <td class="token-count">${stats.tokens.toLocaleString()}</td>
                            <td>
                                ${percentage}%
                                <div class="chart-bar" style="width: ${percentage}%"></div>
                            </td>
                        </tr>
                            `;
                          }).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}

            ${Object.keys(byUser).length > 0 ? `
            <div class="section">
                <h2>👤 Usage by User</h2>
                <table class="table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Sessions</th>
                            <th>Tokens</th>
                            <th>Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(byUser)
                          .sort((a, b) => b[1].tokens - a[1].tokens)
                          .map(([user, stats]) => {
                            const percentage = ((stats.tokens / summary.totalTokens) * 100).toFixed(1);
                            return `
                        <tr>
                            <td><strong>${escapeHtml(user)}</strong></td>
                            <td>${stats.sessions.toLocaleString()}</td>
                            <td class="token-count">${stats.tokens.toLocaleString()}</td>
                            <td>
                                ${percentage}%
                                <div class="chart-bar" style="width: ${percentage}%"></div>
                            </td>
                        </tr>
                            `;
                          }).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}

            ${topFiles.length > 0 ? `
            <div class="section">
                <h2>📁 Most Modified Files</h2>
                <table class="table">
                    <thead>
                        <tr>
                            <th>File</th>
                            <th>Modifications</th>
                            <th>Total Tokens</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${topFiles.map(file => `
                        <tr>
                            <td class="file-path">${escapeHtml(file.path)}</td>
                            <td>${file.count}</td>
                            <td class="token-count">${file.totalTokens.toLocaleString()}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}

            ${recentSessions.length > 0 ? `
            <div class="section">
                <h2>🕐 Recent Sessions (Last 50)</h2>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Tool</th>
                            <th>Model</th>
                            <th>Tokens</th>
                            <th>Files</th>
                            <th>Commit</th>
                            <th>User</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recentSessions.map(session => {
                          const badgeClass = session.tool.toLowerCase().includes('cursor') ? 'badge-cursor' :
                                           session.tool.toLowerCase().includes('claude') ? 'badge-claude' :
                                           session.tool.toLowerCase().includes('copilot') ? 'badge-copilot' : 'badge-unknown';
                          return `
                        <tr>
                            <td>${new Date(session.timestamp).toLocaleString()}</td>
                            <td><span class="badge ${badgeClass}">${escapeHtml(session.tool)}</span></td>
                            <td>${escapeHtml(session.model)}</td>
                            <td class="token-count">${session.tokens.total.toLocaleString()}</td>
                            <td>${session.files.length}</td>
                            <td class="file-path">${session.commit ? session.commit.substring(0, 8) : 'N/A'}</td>
                            <td>${escapeHtml(session.userId)}</td>
                        </tr>
                          `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}
        </div>
        <div class="footer">
            Generated by SDLC1 AI Usage Tracking System | ${new Date(report.timestamp).toLocaleString()}
        </div>
    </div>
</body>
</html>`;
}

/**
 * Generate empty HTML report
 */
function generateEmptyHTMLReport(report) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Usage Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #f3f4f6;
            padding: 20px;
            color: #1f2937;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            padding: 40px;
            text-align: center;
        }
        h1 { color: #667eea; margin-bottom: 20px; }
        p { color: #6b7280; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 AI Usage Report</h1>
        <p>No AI usage data found yet.</p>
        <p style="margin-top: 20px; font-size: 14px;">
            Start tracking by running: <code>npm run ai:track</code>
        </p>
    </div>
</body>
</html>`;
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Run if called directly
if (require.main === module) {
  generateAIUsageReport();
}

module.exports = { generateAIUsageReport };

