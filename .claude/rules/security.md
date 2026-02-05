# Security Rules

- NEVER hardcode API keys, secrets, or credentials in source code
- Always load secrets from environment variables or a secrets manager
- Validate and sanitize all external input (user input, API responses, LLM outputs)
- Use parameterized queries for database operations
- Sanitize LLM outputs before rendering in UI (prevent XSS from model output)
- Set appropriate timeouts on all external API calls
- Log security-relevant events (auth failures, permission denials)
- Never log sensitive data (API keys, user passwords, PII)
