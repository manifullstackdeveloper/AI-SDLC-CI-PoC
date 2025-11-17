# Semgrep Error Fix Guide

## Quick Reference

When Semgrep blocks your commit, follow these steps:

1. **Check the error output** - Shows file, line, and issue
2. **Review detailed report** - `reports/semgrep-results.json`
3. **Fix the issue** - Use examples below
4. **Re-run validation** - `npm run semgrep`
5. **Commit again** - `git commit`

## Common Errors and Fixes

### 1. `typescript-no-any` - Use of 'any' type

**Error Message:**

```
Use of 'any' type violates coding standards. Use specific types instead.
```

**Example Violation:**

```typescript
// ❌ BAD
function processData(data: any) {
  return data.value;
}

const item: any = { id: 1, name: 'Test' };
```

**Fix:**

```typescript
// ✅ GOOD
interface Data {
  value: string;
}

function processData(data: Data) {
  return data.value;
}

interface Item {
  id: string;
  name: string;
}

const item: Item = { id: '1', name: 'Test' };
```

**Quick Fix:**

- Replace `any` with specific interface or type
- Use `unknown` if type is truly unknown, then add type guards

---

### 2. `nestjs-missing-validation` - DTOs must be explicitly typed

**Error Message:**

```
DTOs must be explicitly typed with validation decorators
```

**Example Violation:**

```typescript
// ❌ BAD
@Post()
create(@Body() dto) {
  return this.service.create(dto);
}
```

**Fix:**

```typescript
// ✅ GOOD
@Post()
create(@Body() dto: CreateItemDto) {
  return this.service.create(dto);
}
```

**Quick Fix:**

- Always type DTO parameters: `@Body() dto: CreateItemDto`
- Ensure DTO class has validation decorators (`@IsString()`, `@IsNotEmpty()`, etc.)

---

### 3. `security-hardcoded-secrets` - Hardcoded secrets detected

**Error Message:**

```
Hardcoded secrets detected. Use environment variables instead.
```

**Example Violation:**

```typescript
// ❌ BAD
const password = 'secret123';
const apiKey = 'sk-1234567890';
const secret = 'my-secret-key';
```

**Fix:**

```typescript
// ✅ GOOD
const password = process.env.API_PASSWORD;
const apiKey = process.env.API_KEY;
const secret = process.env.SECRET_KEY;

// Or use ConfigService in NestJS
constructor(private configService: ConfigService) {}
const apiKey = this.configService.get<string>('API_KEY');
```

**Quick Fix:**

- Move secrets to `.env` file
- Use `process.env.VARIABLE_NAME`
- Never commit `.env` file (already in `.gitignore`)

---

### 4. `security-sql-injection` - Potential SQL injection

**Error Message:**

```
Potential SQL injection. Use parameterized queries.
```

**Example Violation:**

```typescript
// ❌ BAD
const query = `SELECT * FROM users WHERE id = ${userId}`;
query.exec(query);
```

**Fix:**

```typescript
// ✅ GOOD
// Use TypeORM/Prisma parameterized queries
const user = await this.userRepository.findOne({
  where: { id: userId },
});

// Or with raw queries
const user = await this.dataSource.query('SELECT * FROM users WHERE id = $1', [userId]);
```

**Quick Fix:**

- Use ORM methods instead of raw SQL
- If raw SQL needed, use parameterized queries with placeholders

---

### 5. `nestjs-missing-logger` - Services must include Logger

**Error Message:**

```
Services must include Logger instance
```

**Example Violation:**

```typescript
// ❌ BAD
@Injectable()
export class ItemsService {
  // Missing logger
  create(item: CreateItemDto) {
    return this.items.push(item);
  }
}
```

**Fix:**

```typescript
// ✅ GOOD
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ItemsService {
  private readonly logger = new Logger(ItemsService.name);

  create(item: CreateItemDto) {
    this.logger.log(`Creating item: ${item.name}`);
    return this.items.push(item);
  }
}
```

**Quick Fix:**

- Add `private readonly logger = new Logger(ServiceName.name);` to all services
- Use logger for operations: `this.logger.log()`, `this.logger.error()`, etc.

---

### 6. `error-handling-missing` - Async functions should have error handling

**Error Message:**

```
Async functions should have error handling
```

**Example Violation:**

```typescript
// ❌ BAD
async fetchData() {
  const data = await this.httpService.get('/api/data');
  return data;
}
```

**Fix:**

```typescript
// ✅ GOOD
async fetchData() {
  try {
    const data = await this.httpService.get('/api/data');
    return data;
  } catch (error) {
    this.logger.error(`Failed to fetch data: ${error.message}`);
    throw new InternalServerErrorException('Failed to fetch data');
  }
}
```

**Quick Fix:**

- Wrap async operations in try-catch blocks
- Log errors and throw appropriate exceptions
- Use NestJS exception filters for global error handling

---

## Viewing Detailed Results

### JSON Report

```bash
cat reports/semgrep-results.json | jq '.results[] | {rule_id, message, path, start: .start.line}'
```

### Human-Readable Output

```bash
semgrep --config=.semgrep.yml src/
```

### Check Specific Severity

```bash
# Only errors
semgrep --config=.semgrep.yml --severity=ERROR src/

# Only warnings
semgrep --config=.semgrep.yml --severity=WARNING src/
```

## Prevention Tips

1. **Use TypeScript strictly** - Avoid `any` types
2. **Type all DTOs** - Always specify types for parameters
3. **Use environment variables** - Never hardcode secrets
4. **Add Logger to services** - Required in all `@Injectable()` classes
5. **Handle errors** - Wrap async operations in try-catch
6. **Use ORMs** - Avoid raw SQL queries

## Still Stuck?

1. Check `reports/semgrep-results.json` for exact file and line
2. Review `.semgrep.yml` to understand the rule
3. See `.standards/common-standards.md` for coding standards
4. Ask team for help if needed
