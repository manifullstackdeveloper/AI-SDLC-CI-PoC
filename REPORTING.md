# Validation Reporting System

## Overview

Automated reporting system captures code quality violations from AI-generated and manually edited code.

## Report Generation

### Pre-Commit Reports

- **Trigger**: Automatically when validation fails during commit
- **Location**: `reports/validation-report.html`
- **Purpose**: Help developers fix issues before committing

### CI Pipeline Reports

- **Trigger**: Every push/PR to main/develop branches
- **Artifacts**: HTML and JSON reports uploaded to GitHub Actions
- **Retention**: 30 days
- **Email**: Sent on failure (if configured)

## Report Contents

### HTML Report Includes:

- Overall validation status (PASSED/FAILED)
- Violation count and details
- Individual check results (Linting, Formatting, Tests, Build, Coverage)
- Coverage metrics (Lines, Statements, Functions, Branches)
- Detailed error messages for each violation

### JSON Report Includes:

- Machine-readable format
- Timestamp
- Detailed results for all checks
- Violation details with error messages

## Usage

**Generate report manually:**

```bash
npm run report
```

**Generate and email report:**

```bash
npm run report:email
```

**View report:**
Open `reports/validation-report.html` in browser

## Email Notifications

### Local Setup

1. Copy `.env.example` to `.env`
2. Configure SMTP settings
3. Run `npm run report:email`

### GitHub Actions Setup

1. Add repository secrets:
   - `SMTP_SERVER`, `SMTP_PORT`
   - `SMTP_USERNAME`, `SMTP_PASSWORD`
   - `EMAIL_FROM`, `EMAIL_TO`
2. Email sent automatically on CI failure

## What Gets Captured

- **Linting violations**: ESLint errors (e.g., `any` types)
- **Formatting issues**: Prettier violations
- **Test failures**: Jest test errors
- **Build errors**: TypeScript compilation issues
- **Coverage gaps**: Below 80% threshold
- **Standards violations**: All AI coding standards
