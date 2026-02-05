---
description: Testing patterns and conventions for this project
---

# Testing Patterns

## Structure

- Place tests adjacent to source files or in a `__tests__/` directory
- Name test files: `*.test.ts` or `*.spec.ts`
- Group tests by feature, not by file

## Conventions

- Use descriptive test names: `should [expected behavior] when [condition]`
- Follow AAA pattern: Arrange, Act, Assert
- One assertion per test when possible
- Mock external dependencies, not internal modules
- Use factories for test data, not raw objects

## Coverage

- Aim for meaningful coverage, not 100%
- Prioritize: business logic > edge cases > happy paths > UI
- Always test error paths and boundary conditions
