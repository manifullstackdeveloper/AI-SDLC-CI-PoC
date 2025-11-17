#!/usr/bin/env node

/**
 * AI Usage Tracking Script
 * Captures AI generation metadata including model, tokens, files, and timestamps
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const AI_USAGE_DIR = path.join(__dirname, '../.ai-usage');
const AI_USAGE_FILE = path.join(AI_USAGE_DIR, 'usage.json');

// Ensure AI usage directory exists
if (!fs.existsSync(AI_USAGE_DIR)) {
  fs.mkdirSync(AI_USAGE_DIR, { recursive: true });
}

/**
 * Load existing AI usage data
 */
function loadUsageData() {
  if (fs.existsSync(AI_USAGE_FILE)) {
    try {
      const data = fs.readFileSync(AI_USAGE_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.warn('Warning: Could not parse AI usage data, starting fresh');
      return { sessions: [], summary: {} };
    }
  }
  return { sessions: [], summary: {} };
}

/**
 * Save AI usage data
 */
function saveUsageData(data) {
  fs.writeFileSync(AI_USAGE_FILE, JSON.stringify(data, null, 2));
}

/**
 * Get current git commit hash
 */
function getCurrentCommit() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
  } catch (error) {
    return null;
  }
}

/**
 * Get current git branch
 */
function getCurrentBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
  } catch (error) {
    return 'unknown';
  }
}

/**
 * Get list of staged files
 */
function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only', { encoding: 'utf-8' });
    return output.trim().split('\n').filter(f => f.length > 0);
  } catch (error) {
    return [];
  }
}

/**
 * Get file stats (lines added/modified)
 */
function getFileStats(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').length;
    return {
      lines,
      size: stats.size,
      modified: stats.mtime.toISOString(),
    };
  } catch (error) {
    return { lines: 0, size: 0, modified: null };
  }
}

/**
 * Detect AI tool from environment or git config
 */
function detectAITool() {
  // Check for Cursor
  if (process.env.CURSOR_SESSION_ID || process.env.CURSOR_VERSION) {
    return 'Cursor';
  }
  
  // Check for Claude
  if (process.env.CLAUDE_SESSION_ID || process.env.ANTHROPIC_API_KEY) {
    return 'Claude Code';
  }
  
  // Check for GitHub Copilot
  if (process.env.GITHUB_COPILOT || process.env.COPILOT_SESSION) {
    return 'GitHub Copilot';
  }
  
  // Check git config
  try {
    const gitConfig = execSync('git config --get-regexp "ai\\..*"', { encoding: 'utf-8' });
    if (gitConfig.includes('cursor')) return 'Cursor';
    if (gitConfig.includes('claude')) return 'Claude Code';
    if (gitConfig.includes('copilot')) return 'GitHub Copilot';
  } catch (error) {
    // No git config found
  }
  
  return 'Unknown';
}

/**
 * Track AI usage session
 */
function trackUsage(options = {}) {
  const {
    model = 'unknown',
    tool = null,
    inputTokens = 0,
    outputTokens = 0,
    files = [],
    prompt = null,
    commitHash = null,
    branch = null,
    userId = process.env.USER || process.env.USERNAME || 'unknown',
  } = options;

  const data = loadUsageData();
  const detectedTool = tool || detectAITool();
  const currentCommit = commitHash || getCurrentCommit();
  const currentBranch = branch || getCurrentBranch();
  const stagedFiles = files.length > 0 ? files : getStagedFiles();

  const session = {
    id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    tool: detectedTool,
    model: model,
    tokens: {
      input: parseInt(inputTokens) || 0,
      output: parseInt(outputTokens) || 0,
      total: (parseInt(inputTokens) || 0) + (parseInt(outputTokens) || 0),
    },
    files: stagedFiles.map(file => ({
      path: file,
      ...getFileStats(file),
    })),
    commit: currentCommit,
    branch: currentBranch,
    userId: userId,
    prompt: prompt ? prompt.substring(0, 200) : null, // Truncate for storage
  };

  // Initialize summary if needed
  if (!data.summary) {
    data.summary = {
      totalSessions: 0,
      totalTokens: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalFiles: 0,
      byTool: {},
      byModel: {},
      byUser: {},
    };
  }
  
  // Ensure nested objects exist and initialize counters
  if (!data.summary.byTool) data.summary.byTool = {};
  if (!data.summary.byModel) data.summary.byModel = {};
  if (!data.summary.byUser) data.summary.byUser = {};
  
  // Initialize counters if null/undefined
  if (data.summary.totalSessions == null) data.summary.totalSessions = 0;
  if (data.summary.totalTokens == null) data.summary.totalTokens = 0;
  if (data.summary.totalInputTokens == null) data.summary.totalInputTokens = 0;
  if (data.summary.totalOutputTokens == null) data.summary.totalOutputTokens = 0;
  if (data.summary.totalFiles == null) data.summary.totalFiles = 0;

  data.summary.totalSessions++;
  data.summary.totalTokens += session.tokens.total;
  data.summary.totalInputTokens += session.tokens.input;
  data.summary.totalOutputTokens += session.tokens.output;
  data.summary.totalFiles += session.files.length;

  // Update by tool
  if (!data.summary.byTool[detectedTool]) {
    data.summary.byTool[detectedTool] = {
      sessions: 0,
      tokens: 0,
      files: 0,
    };
  }
  data.summary.byTool[detectedTool].sessions++;
  data.summary.byTool[detectedTool].tokens += session.tokens.total;
  data.summary.byTool[detectedTool].files += session.files.length;

  // Update by model
  if (!data.summary.byModel[model]) {
    data.summary.byModel[model] = {
      sessions: 0,
      tokens: 0,
    };
  }
  data.summary.byModel[model].sessions++;
  data.summary.byModel[model].tokens += session.tokens.total;

  // Update by user
  if (!data.summary.byUser[userId]) {
    data.summary.byUser[userId] = {
      sessions: 0,
      tokens: 0,
    };
  }
  data.summary.byUser[userId].sessions++;
  data.summary.byUser[userId].tokens += session.tokens.total;

  // Add session
  data.sessions.push(session);

  // Keep only last 1000 sessions to prevent file from growing too large
  if (data.sessions.length > 1000) {
    data.sessions = data.sessions.slice(-1000);
  }

  saveUsageData(data);

  return session;
}

/**
 * CLI interface
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === '--help') {
    console.log(`
AI Usage Tracking

Usage:
  node track-ai-usage.js                    Track current commit automatically
  node track-ai-usage.js --model <name>     Track with specific model
  node track-ai-usage.js --help             Show this help

Environment Variables:
  CURSOR_SESSION_ID         - Auto-detect Cursor
  CLAUDE_SESSION_ID         - Auto-detect Claude Code
  GITHUB_COPILOT            - Auto-detect GitHub Copilot

Git Config:
  git config ai.tool "Cursor"              Set default AI tool
  git config ai.model "claude-3-opus"      Set default model

Examples:
  node track-ai-usage.js
  node track-ai-usage.js --model claude-3-opus --input-tokens 1500 --output-tokens 800
    `);
  } else if (args.length === 0) {
    // Interactive mode - track current commit
    const session = trackUsage();
    console.log('✅ AI usage tracked:');
    console.log(`   Session ID: ${session.id}`);
    console.log(`   Tool: ${session.tool}`);
    console.log(`   Model: ${session.model}`);
    console.log(`   Tokens: ${session.tokens.total} (input: ${session.tokens.input}, output: ${session.tokens.output})`);
    console.log(`   Files: ${session.files.length}`);
    console.log(`   Commit: ${session.commit}`);
  } else {
    // Parse command line arguments
    let model = 'unknown';
    let inputTokens = 0;
    let outputTokens = 0;
    let tool = null;
    
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--model' && args[i + 1]) {
        model = args[i + 1];
        i++;
      } else if (args[i] === '--input-tokens' && args[i + 1]) {
        inputTokens = parseInt(args[i + 1]) || 0;
        i++;
      } else if (args[i] === '--output-tokens' && args[i + 1]) {
        outputTokens = parseInt(args[i + 1]) || 0;
        i++;
      } else if (args[i] === '--tool' && args[i + 1]) {
        tool = args[i + 1];
        i++;
      }
    }
    
    const session = trackUsage({
      model,
      inputTokens,
      outputTokens,
      tool,
    });
    
    console.log('✅ AI usage tracked:');
    console.log(`   Session ID: ${session.id}`);
    console.log(`   Tool: ${session.tool}`);
    console.log(`   Model: ${session.model}`);
    console.log(`   Tokens: ${session.tokens.total} (input: ${session.tokens.input}, output: ${session.tokens.output})`);
    console.log(`   Files: ${session.files.length}`);
    console.log(`   Commit: ${session.commit}`);
  }
}

module.exports = { trackUsage, loadUsageData, saveUsageData };

