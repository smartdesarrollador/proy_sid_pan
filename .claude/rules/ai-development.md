# AI Development Rules

- Always define prompts in config/prompt_templates.yaml, not inline in code
- Use structured outputs (JSON mode) when parsing LLM responses programmatically
- Implement retry logic with exponential backoff for all LLM API calls
- Log all LLM interactions: input tokens, output tokens, latency, model used
- Use streaming for long-running completions when possible
- Cache embeddings and repeated queries to reduce cost
- Set token budgets per request to prevent runaway costs
- Test prompts with edge cases: empty input, very long input, adversarial input
- Version your prompts alongside code changes
