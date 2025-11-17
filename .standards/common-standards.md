# Common AI Coding Standards for SDLC1

This file contains the shared coding standards used across all AI tools (Cursor, Claude Code, GitHub Copilot).

## Core Rules

- Use TypeScript strict mode, no `any` types
- All DTOs must use class-validator decorators
- Services must include Logger for operations
- Controllers must use proper HTTP status codes
- All methods must handle errors with proper exceptions
- Write unit tests for all services and controllers
- Follow NestJS architectural patterns (modules, controllers, services, DTOs)
- Use dependency injection, avoid direct instantiation
- Validate all inputs using DTOs and ValidationPipe
- Log all operations (create, read, update, delete)

## Security

- Never expose sensitive data in logs
- Validate and sanitize all inputs
- Use proper HTTP status codes
- Handle errors gracefully without exposing internals

## Code Quality

- ESLint must pass with no errors
- Prettier formatting required
- Test coverage minimum 80%
- All tests must pass before commit

## NestJS Patterns

- Use modules to organize features
- Controllers handle HTTP requests/responses only
- Services contain business logic
- DTOs for all data transfer with validation
- Use dependency injection for all dependencies
- Logger instance in every service
- Proper HTTP status codes (201 for create, 204 for delete, etc.)
- Exception filters for error handling
