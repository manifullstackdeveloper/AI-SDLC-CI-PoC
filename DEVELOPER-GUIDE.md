# Developer Guide - Fixing Semgrep Errors

## When Commit is Blocked by Semgrep

If you see this error during `git commit`:

```
❌ Semgrep found ERROR level security issues
```

Follow these steps:

### Step 1: See What's Wrong

The error output shows:

- **File path** - Which file has the issue
- **Line number** - Exact line with the problem
- **Rule ID** - Which rule was violated
- **Message** - What's wrong

Example:

```
src/items/items.service.ts:6:7
  typescript-no-any
  Use of 'any' type violates coding standards. Use specific types instead.
```

### Step 2: Check Detailed Report

```bash
# View JSON report
cat reports/semgrep-results.json | jq '.results[] | {rule_id, message, path, start: .start.line}'

# Or view human-readable
semgrep --config=.semgrep.yml --severity=ERROR src/
```

### Step 3: Fix the Issue

See `SEMGREP-FIXES.md` for detailed fixes for each error type.

**Quick fixes:**

1. **`typescript-no-any`** - Replace `any` with specific type
2. **`nestjs-missing-validation`** - Add type to DTO parameter
3. **`security-hardcoded-secrets`** - Use `process.env` instead
4. **`security-sql-injection`** - Use ORM methods

### Step 4: Verify Fix

```bash
# Test Semgrep locally
npm run semgrep

# If it passes, try committing again
git add .
git commit -m "your message"
```

## Common Error Types

### 1. `typescript-no-any` - Any Type Usage

**Error:**

```typescript
const item: any = { id: 1 };
```

**Fix:**

```typescript
interface Item {
  id: string;
}
const item: Item = { id: '1' };
```

### 2. `nestjs-missing-validation` - Untyped DTO

**Error:**

```typescript
@Post()
create(@Body() dto) {  // Missing type!
  return this.service.create(dto);
}
```

**Fix:**

```typescript
@Post()
create(@Body() dto: CreateItemDto) {  // ✅ Typed
  return this.service.create(dto);
}
```

### 3. `security-hardcoded-secrets` - Hardcoded Secrets

**Error:**

```typescript
const apiKey = 'sk-1234567890'; // ❌ Hardcoded
```

**Fix:**

```typescript
const apiKey = process.env.API_KEY; // ✅ From environment
```

## Getting Help

1. **Check SEMGREP-FIXES.md** - Detailed examples for each error
2. **Review reports/semgrep-results.json** - Full error details
3. **Ask team** - If you're stuck, ask for help
4. **Check standards** - See `.standards/common-standards.md`

## Prevention Tips

- ✅ Always type variables (avoid `any`)
- ✅ Type all DTO parameters
- ✅ Use environment variables for secrets
- ✅ Use ORMs instead of raw SQL
- ✅ Run `npm run semgrep` before committing
