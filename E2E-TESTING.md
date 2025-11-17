# E2E Testing Guide

## Complete Validation Pipeline

### 1. AI-Assisted Coding (IDE) ✅

**Tools**: Cursor / Claude Code / GitHub Copilot
**Purpose**: Prevent violations early & guide developer

**Configuration**:

- `.standards/common-standards.md` - Common standards
- `.claude/claude.md` - Claude Code instructions
- `.cursor/rules/*.mdc` - Cursor IDE rules
- `.github/copilot-instructions.md` - Copilot instructions

**How it works**:

- AI tools read standards files when generating code
- Provides real-time guidance during development
- Helps prevent violations before commit

### 2. Pre-Commit Hooks ✅

**Tools**: Husky + Semgrep + ESLint
**Purpose**: Stop violations before commit

**What runs**:

```bash
git commit
  ↓
Pre-commit hook triggers:
  - ESLint (code quality)
  - Prettier (formatting)
  - Semgrep (security patterns)
  - Jest (related tests)
```

**Configuration**:

- `.husky/pre-commit` - Hook script
- `.lintstagedrc.js` - Staged file processing
- `.semgrep.yml` - Security rules
- `.eslintrc.js` - Code quality rules

**Manual test**:

```bash
# Stage some files
git add src/

# Try to commit (will trigger validation)
git commit -m "test commit"

# If validation fails, report generated:
# reports/validation-report.html
```

### 3. Pull Request Validation (CI) ✅

**Tools**: Semgrep + OPA + Security checks
**Purpose**: Enforce rules & block PR

**What runs on PR**:

1. **Semgrep** - Security pattern scanning
2. **OPA** - Policy validation
3. **ESLint** - Code quality
4. **Prettier** - Formatting
5. **Jest** - Tests with coverage
6. **Build** - TypeScript compilation

**Configuration**:

- `.github/workflows/ci.yml` - CI pipeline
- `policies/security.rego` - OPA policies
- `.semgrep.yml` - Security rules

**Manual test**:

```bash
# Create a branch
git checkout -b test-branch

# Make changes
echo "const x: any = 1;" >> src/test.ts

# Commit and push
git add src/test.ts
git commit -m "test violation"
git push origin test-branch

# Create PR - CI will run and block if violations found
```

## Testing Each Layer

### Test AI Guidance

1. Open Cursor/Claude/Copilot
2. Ask AI to generate code
3. Verify it follows standards from `.standards/common-standards.md`

### Test Pre-Commit Hook

```bash
# Add a violation
echo "const x: any = 1;" >> src/test.ts
git add src/test.ts

# Try to commit (should fail)
git commit -m "test"
# ✅ Hook blocks commit
# ✅ Report generated in reports/validation-report.html
```

### Test CI Pipeline

```bash
# Create PR with violations
git checkout -b test-pr
echo "const password = 'secret123';" >> src/test.ts
git add src/test.ts
git commit -m "test security violation"
git push origin test-pr

# Create PR on GitHub
# ✅ CI runs Semgrep + OPA
# ✅ PR blocked if violations found
# ✅ Reports uploaded as artifacts
```

## Security Checks

### Semgrep Rules

- No `any` types
- Missing Logger in services
- Missing DTO validation
- Hardcoded secrets
- SQL injection patterns
- Missing error handling

### OPA Policies

- Hardcoded secrets detection
- Missing input validation
- Missing error handling
- Missing Logger instances

## Reports Generated

**Pre-commit**:

- `reports/validation-report.html` - HTML report
- `reports/validation-report.json` - JSON report

**CI Pipeline**:

- `reports/semgrep-results.json` - Semgrep findings
- `reports/opa-results.json` - OPA policy results
- `reports/validation-report.html` - Full validation report
- Coverage reports

## Quick Commands

```bash
# Run all validations locally
npm run lint:check      # ESLint
npm run format:check    # Prettier
npm run semgrep         # Semgrep
npm run opa             # OPA
npm run test:cov        # Tests
npm run build           # Build

# Run security checks
npm run security        # Semgrep + OPA

# Generate report
npm run report          # HTML report
```

## Expected Behavior

✅ **AI tools** guide developers during coding
✅ **Pre-commit hooks** block commits with violations
✅ **CI pipeline** blocks PRs with violations
✅ **Reports** generated at each stage
✅ **Email notifications** sent on CI failure (if configured)
