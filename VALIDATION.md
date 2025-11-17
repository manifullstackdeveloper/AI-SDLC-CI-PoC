# Validation Architecture

## Enforcement Mechanism

**ESLint rules** (`.eslintrc.js`) are the ACTUAL enforcement that blocks commits:

- Pre-commit hook → lint-staged → ESLint → Blocks commit if rules violated
- Rule: `@typescript-eslint/no-explicit-any: 'error'` blocks `any` types
- This is what prevents code from being committed

## AI Guidance (Not Enforcement)

**Common standards** (`.standards/common-standards.md`) are shared across all AI tools:

- **Cursor IDE**: Reads `.cursor/rules/*.mdc` (references common standards)
- **Claude Code**: Reads `.claude/claude.md` (references common standards)
- **GitHub Copilot**: Reads `.github/copilot-instructions.md` (references common standards)
- These help AI follow standards but don't block commits
- They're instructions for AI, not validators
- All tools reference the same common standards file to avoid duplication

## How They Work Together

1. **AI generates code** → Follows Cursor/Claude rules
2. **Developer commits** → Pre-commit hook runs ESLint
3. **ESLint validates** → Blocks commit if standards violated
4. **Result**: AI guidance + Automated enforcement
