# AI Standards Structure

## Consistent Folder Structure

All AI standards are organized in consistent dot-prefixed folders:

```
.standards/
  └── common-standards.md      ← Single source of truth (no duplication)
.claude/
  └── claude.md                ← References common standards
.cursor/
  └── rules/
      ├── coding-standards.mdc ← References common standards
      └── nestjs-patterns.mdc
.github/
  └── copilot-instructions.md  ← References common standards
```

## Benefits

✅ **Consistent Structure**: All tools use dot-prefixed folders (`.claude/`, `.cursor/`, `.github/`)
✅ **No Duplication**: Single source of truth in `.standards/common-standards.md`
✅ **Easy Maintenance**: Update standards in one place, all tools reference it
✅ **Tool-Specific**: Each tool can have its own quick reference while referencing common standards

## How It Works

1. **Common Standards** (`.standards/common-standards.md`):
   - Contains all coding standards
   - Single source of truth
   - Updated once, applies everywhere

2. **Tool-Specific Files**:
   - `.claude/claude.md` - Quick reference for Claude Code
   - `.cursor/rules/*.mdc` - Detailed rules for Cursor IDE
   - `.github/copilot-instructions.md` - Quick reference for Copilot
   - All reference `.standards/common-standards.md`

## Validation

CI pipeline validates all standards files exist:

- ✓ Common standards file
- ✓ Claude Code file
- ✓ Cursor IDE files
- ✓ GitHub Copilot file
