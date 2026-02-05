# Code Style Rules

- Use type hints for all function signatures
- Prefer dataclasses or Pydantic models over raw dicts
- Use async/await for I/O-bound operations (API calls, DB queries)
- Keep functions under 50 lines; extract helpers for complex logic
- Use constants for magic numbers and repeated strings
- Prefer f-strings over string concatenation or .format()
- Import order: stdlib, third-party, local (enforced by ruff)
