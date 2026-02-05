# Deployment Runbook

## Pre-Deployment Checklist

- [ ] All tests passing (`make test`)
- [ ] Linting clean (`make lint`)
- [ ] Environment variables updated in production
- [ ] Docker image builds successfully (`make docker-build`)
- [ ] API keys rotated if needed

## Docker Deployment

```bash
# Build production image
docker build --target production -t proy_temp:latest .

# Run
docker run -d --env-file .env -p 8000:8000 proy_temp:latest
```

## Rollback

```bash
# Revert to previous image tag
docker run -d --env-file .env -p 8000:8000 proy_temp:<previous-tag>
```
