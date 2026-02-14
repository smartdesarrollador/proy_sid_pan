# Next.js Deployment Checklist

Checklist completo para deployar aplicaciones Next.js a producción.

## 📋 Pre-Deployment

### Code Quality

- [ ] Todos los tests pasando (`npm test`)
- [ ] Linters pasando sin warnings (`npm run lint`)
- [ ] Type checking exitoso (`npm run type-check`)
- [ ] Formatting consistente (`npm run format:check`)
- [ ] No hay console.logs en producción
- [ ] Código muerto eliminado
- [ ] Comentarios TODO resueltos o documentados

### Build & Performance

- [ ] Build local exitoso (`npm run build`)
- [ ] No hay errores de build
- [ ] Bundle size aceptable (< 200KB first load)
- [ ] Analizar bundle con `ANALYZE=true npm run build`
- [ ] Code splitting implementado donde corresponda
- [ ] Dynamic imports para componentes pesados
- [ ] Images optimizadas (Next.js Image component)
- [ ] Fonts optimizados (next/font)

### Security

- [ ] Dependencias actualizadas (`npm audit`)
- [ ] No hay vulnerabilidades críticas
- [ ] Secrets NO commiteados en código
- [ ] `.env.local` en `.gitignore`
- [ ] API keys rotadas antes de deploy
- [ ] CORS configurado correctamente
- [ ] Rate limiting implementado
- [ ] SQL injection protegido (ORM/prepared statements)
- [ ] XSS protegido (React auto-escapes)
- [ ] CSRF tokens en formularios POST

### SEO & Accessibility

- [ ] Metadata configurado en todas las páginas
- [ ] OpenGraph tags presentes
- [ ] robots.txt configurado
- [ ] sitemap.xml generado
- [ ] Lighthouse SEO score > 90
- [ ] Lighthouse Accessibility score > 90
- [ ] Semantic HTML usado
- [ ] ARIA labels donde corresponda

---

## ⚙️ Configuration

### Environment Variables

- [ ] Variables de entorno configuradas en plataforma de deploy
- [ ] `NEXT_PUBLIC_*` variables definidas para cliente
- [ ] Secrets definidos en vault/secrets manager
- [ ] `.env.example` actualizado con todas las variables necesarias
- [ ] Validación de env vars con Zod o similar
- [ ] `NODE_ENV=production` configurado

### Next.js Config

- [ ] `next.config.js` optimizado para producción
- [ ] `output: 'standalone'` si es self-hosted
- [ ] `reactStrictMode: true` habilitado
- [ ] `swcMinify: true` habilitado
- [ ] `poweredByHeader: false` configurado
- [ ] Security headers configurados
- [ ] Image domains whitelisteados
- [ ] Redirects configurados
- [ ] Rewrites configurados si necesario

### Vercel Specific

- [ ] `vercel.json` configurado
- [ ] Regiones configuradas
- [ ] Headers personalizados definidos
- [ ] Cron jobs configurados (si aplica)
- [ ] Functions memory/timeout configurados
- [ ] Preview deployments habilitados

### Self-Hosted Specific

- [ ] Dockerfile optimizado (multi-stage)
- [ ] `.dockerignore` configurado
- [ ] docker-compose.yml listo
- [ ] Nginx configurado
- [ ] SSL certificates instalados
- [ ] PM2 ecosystem.config.js configurado
- [ ] Health checks implementados

---

## 🚀 Deployment

### Pre-Deploy Checks

- [ ] Backup de base de datos tomado
- [ ] Migrations ejecutadas en staging
- [ ] Rollback plan documentado
- [ ] Maintenance window comunicado (si aplica)
- [ ] Stakeholders notificados

### Vercel Deploy

- [ ] Vercel CLI instalado (`npm i -g vercel`)
- [ ] Login exitoso (`vercel login`)
- [ ] Preview deployment exitoso (`vercel`)
- [ ] Tests pasando en preview
- [ ] Production deployment (`vercel --prod`)
- [ ] Deploy verificado en dashboard

### Self-Hosted Deploy

- [ ] Docker image buildeada
- [ ] Image pusheada a registry
- [ ] SSH access al servidor verificado
- [ ] Backup del contenedor anterior
- [ ] Nuevo contenedor iniciado
- [ ] Health check pasando
- [ ] Logs monitoreados

### Database Migrations

- [ ] Migrations reviewed
- [ ] Migrations tested en staging
- [ ] Backup pre-migration tomado
- [ ] Migrations ejecutadas
- [ ] Data integrity verificada
- [ ] Rollback script listo

---

## ✅ Post-Deployment

### Smoke Tests

- [ ] Homepage carga correctamente
- [ ] Login flow funciona
- [ ] API endpoints responden
- [ ] Database connections exitosas
- [ ] Cache funcionando
- [ ] Static assets cargando
- [ ] Forms submitean correctamente
- [ ] Payments procesan (si aplica)

### Performance

- [ ] Lighthouse Performance score > 90
- [ ] Core Web Vitals aceptables:
  - [ ] LCP < 2.5s
  - [ ] FID < 100ms
  - [ ] CLS < 0.1
- [ ] TTI (Time to Interactive) < 3.8s
- [ ] First Contentful Paint < 1.8s

### Security

- [ ] SSL certificate válido
- [ ] HTTPS redirect funcionando
- [ ] Security headers presentes (verificar con securityheaders.com)
- [ ] CORS permitiendo solo dominios autorizados
- [ ] Rate limiting activo
- [ ] No secrets expuestos en responses
- [ ] CSP headers configurados

### Monitoring

- [ ] Error tracking recibiendo eventos (Sentry)
- [ ] Analytics tracking eventos (GA, Vercel Analytics)
- [ ] Performance monitoring activo
- [ ] Uptime monitoring configurado
- [ ] Alerts configurados para errores críticos
- [ ] Logs siendo recolectados
- [ ] Dashboard de métricas accesible

### CDN & Caching

- [ ] CDN caching activo
- [ ] Cache-Control headers correctos
- [ ] Static assets cacheados
- [ ] ISR funcionando (si aplica)
- [ ] Purge cache funcionando

### Documentation

- [ ] Deployment documentado
- [ ] Changelog actualizado
- [ ] README actualizado
- [ ] API docs actualizadas
- [ ] Runbook actualizado

---

## 📊 Monitoring & Maintenance

### Health Checks

- [ ] `/api/health` endpoint funcionando
- [ ] Database health check pasando
- [ ] External APIs health check pasando
- [ ] Uptime monitors configurados

### Logging

- [ ] Application logs siendo recolectados
- [ ] Error logs monitoreados
- [ ] Access logs guardados
- [ ] Log retention policy configurada
- [ ] Log alerts configurados

### Metrics

- [ ] Request rate monitoreado
- [ ] Response time monitoreado
- [ ] Error rate monitoreado
- [ ] Database performance monitoreado
- [ ] Memory usage monitoreado
- [ ] CPU usage monitoreado

### Alerts

- [ ] Error rate spike alerts
- [ ] Downtime alerts
- [ ] High latency alerts
- [ ] High memory usage alerts
- [ ] Failed cron job alerts
- [ ] SSL expiration alerts

---

## 🔄 CI/CD

### GitHub Actions

- [ ] Workflow configurado (`.github/workflows/`)
- [ ] Tests ejecutándose en PRs
- [ ] Linting ejecutándose en PRs
- [ ] Security scan ejecutándose
- [ ] Preview deploys automáticos
- [ ] Production deploys en merge a main
- [ ] Secrets configurados en GitHub

### Pipeline Stages

- [ ] Lint & Type Check stage
- [ ] Unit Tests stage
- [ ] Integration Tests stage
- [ ] E2E Tests stage
- [ ] Security Scan stage
- [ ] Build stage
- [ ] Deploy stage
- [ ] Post-deploy smoke tests

---

## 📱 Post-Launch

### Communication

- [ ] Team notificado del deploy exitoso
- [ ] Stakeholders informados
- [ ] Users notificados de nuevas features (si aplica)
- [ ] Documentation compartida
- [ ] Post-mortem agendado (si hubo issues)

### Monitoring Period

- [ ] Monitor logs por 1 hora post-deploy
- [ ] Monitor error rates
- [ ] Monitor performance metrics
- [ ] Monitor user feedback
- [ ] Review analytics datos

### Follow-up

- [ ] Issues reportados por users resueltos
- [ ] Performance issues identificados y documentados
- [ ] Hotfixes aplicados si necesario
- [ ] Lessons learned documentadas
- [ ] Próximos pasos planificados

---

## 🆘 Rollback Plan

### If Deploy Fails

- [ ] Documentar error exacto
- [ ] Capturar logs relevantes
- [ ] Notificar a team
- [ ] Ejecutar rollback

### Vercel Rollback

```bash
# Ver deployments
vercel ls

# Rollback a deployment anterior
vercel rollback [deployment-url]
```

### Docker Rollback

```bash
# Parar contenedor actual
docker stop nextjs-app
docker rm nextjs-app

# Iniciar versión anterior
docker run -d --name nextjs-app previous-image:tag
```

### Database Rollback

```bash
# Restaurar backup
pg_restore -d database_name backup_file.dump

# Revertir migrations
npm run migrate:down
```

---

## 📝 Checklist Summary

**Before Deploy:**
- Code quality ✓
- Security ✓
- Performance ✓
- Configuration ✓

**During Deploy:**
- Backup ✓
- Deploy ✓
- Migrations ✓
- Verification ✓

**After Deploy:**
- Smoke tests ✓
- Monitoring ✓
- Documentation ✓
- Communication ✓

---

## 🔗 Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Deployment Docs](https://vercel.com/docs)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Security Headers](https://securityheaders.com/)
- [Web Vitals](https://web.dev/vitals/)

---

**✅ READY TO DEPLOY!**

Use este checklist antes de cada deployment para asegurar deployments exitosos y sin downtime.
