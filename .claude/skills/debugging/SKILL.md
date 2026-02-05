---
description: Debugging strategies and common issue patterns for AI/ML projects
---

# Debugging Patterns

## LLM-Specific Issues

### Unexpected Outputs
1. Check prompt template rendering (missing variables, wrong escaping)
2. Verify temperature and max_tokens settings
3. Review system prompt for conflicting instructions
4. Test with deterministic settings (temperature=0) to isolate randomness

### Rate Limiting / API Errors
1. Check rate limit headers in response
2. Verify API key is valid and has quota
3. Implement exponential backoff
4. Check for token count exceeding model limits

### Performance Issues
1. Profile token usage per request
2. Check for unnecessary context in prompts
3. Review embedding batch sizes
4. Monitor vector DB query latency

## General Debugging

### Approach
1. Reproduce the issue with minimal input
2. Check logs at DEBUG level
3. Isolate: is it data, model, or code?
4. Add assertions at boundaries
5. Use structured logging for AI calls (input/output/latency/tokens)

### Common Pitfalls
- Stale cache returning old embeddings
- Token truncation silently cutting important context
- JSON parsing failures on malformed LLM output
- Async race conditions in parallel API calls
