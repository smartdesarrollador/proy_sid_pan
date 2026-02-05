---
description: Code review checklist and standards for this project
---

# Code Review Standards

## Checklist

- [ ] No hardcoded secrets or credentials
- [ ] Input validation at system boundaries
- [ ] Error handling is appropriate (not over-engineered)
- [ ] No N+1 query patterns
- [ ] Functions are focused and under 50 lines
- [ ] Variable names are descriptive
- [ ] No dead code or commented-out blocks
- [ ] Tests cover the changes
- [ ] No breaking changes to public APIs without versioning

## Security Focus

- SQL injection prevention
- XSS prevention
- Authentication/authorization checks
- Sensitive data exposure
- CSRF protection
