# SDLC1 CRUD API

NestJS CRUD API with automated AI standards enforcement via pre-commit hooks and CI/CD.

## Quick Start

```bash
npm install          # Auto-configures husky hooks
npm start            # Runs on http://localhost:3000
```

## Step-by-Step Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

   - Installs all packages
   - Auto-configures Husky git hooks
   - Builds the project

2. **Start development server**

   ```bash
   npm run start:dev
   ```

   - Runs on `http://localhost:3000`
   - Auto-reloads on file changes

3. **Run tests**
   ```bash
   npm test
   ```

## Validation Options

### Manual Validation (Before Commit/Push)

**Validate everything:**

```bash
npm run validate
```

Runs linting + tests with coverage

**Individual checks:**

```bash
npm run lint:check      # Check linting
npm run format:check    # Check formatting
npm run test:cov        # Run tests with coverage
npm run build           # Verify build
```

### Automatic Validation (Git Hooks)

**Pre-commit hook** (runs automatically on `git commit`):

- Lints staged files
- Formats staged files
- Runs related tests
- Blocks commit if validation fails

**Pre-push hook** (runs automatically on `git push`):

- Runs full test suite with coverage
- Checks coverage threshold (80% minimum)
- Builds project
- Blocks push if validation fails

**Skip hooks (if needed):**

```bash
git commit --no-verify   # Skip pre-commit hook
git push --no-verify     # Skip pre-push hook
```

## API Endpoints

- `POST /items` - Create item
- `GET /items` - List all items
- `GET /items/:id` - Get item by ID
- `PATCH /items/:id` - Update item
- `DELETE /items/:id` - Delete item
- `GET /audit` - Read AI usage audit summary (optional `limit` query to return the most recent sessions)

## Validation Reports

**Generate HTML report:**

```bash
npm run report
```

Creates `reports/validation-report.html` with detailed validation results

**Generate and email report:**

```bash
npm run report:email
```

Requires SMTP configuration (see below)

**Pre-commit reports:**

- Automatically generated when validation fails
- Saved to `reports/validation-report.html`
- View locally before fixing issues

**CI Pipeline reports:**

- HTML and JSON reports uploaded as GitHub Actions artifacts
- Email notification sent on failure (if configured)
- Reports available for 30 days

## AI Usage Tracking & Reports

**Automatic tracking:**

AI usage is automatically tracked on every commit via git hooks. No action needed!

**Generate AI usage report:**

```bash
npm run ai:report
```

Creates `reports/ai-usage-report.html` with:

- Total sessions and tokens
- Usage by AI tool (Cursor, Claude, Copilot)
- Usage by model
- Usage by user
- Most modified files
- Complete audit trail

**Manual tracking:**

```bash
npm run ai:track -- --model claude-3-opus --input-tokens 1500 --output-tokens 800
```

**View reports:**

- HTML: `reports/ai-usage-report.html`
- JSON: `reports/ai-usage-report.json`
- Data: `.ai-usage/usage.json`

See [AI-USAGE-TRACKING.md](./AI-USAGE-TRACKING.md) for complete documentation.

## Email Configuration

**For local email notifications**, create `.env` file:

```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@example.com
EMAIL_TO=team@example.com
```

**For GitHub Actions**, add secrets in repository settings:

- `SMTP_SERVER`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`
- `EMAIL_FROM`, `EMAIL_TO`

## AI Standards Enforcement

- **Common Standards**: `.standards/common-standards.md` (shared across all tools)
- **Cursor IDE**: `.cursor/rules/*.mdc` files (references common standards)
- **Claude Code**: `.claude/claude.md` (references common standards)
- **GitHub Copilot**: `.github/copilot-instructions.md` (references common standards)
- **CI/CD**: GitHub Actions validates on push/PR
- **Reports**: HTML reports capture all violations
