# Índice de reportes digeridos

Registro de qué reportes de `reports/` ya fueron destilados en `knowledge-base.md` y qué entradas
generó cada uno. Para el modo **seed incremental**: procesar solo los reportes que NO estén aquí.

| Reporte | Entradas generadas |
|---------|--------------------|
| `reports/2026-06-22-formulario-contacto-recaptcha.md` | LL-001, LL-010 |
| `reports/2026-06-22-footer-administrable-hub.md` | LL-002, LL-020, LL-051 |
| `reports/2026-06-21-trial-30-dias-professional-descarga-desktop.md` | LL-041, LL-042, LL-050, LL-054 |
| `reports/2026-06-20-implementacion-chat-ia.md` | LL-022, LL-023, LL-061 |
| `reports/2026-06-15-implementacion-pago-yape.md` | LL-040, LL-041, LL-052 |
| `reports/2026-03-15-bugfix-desktop-snippets.md` | LL-030, LL-031, LL-053 |
| `reports/varios/frontend_next_hub_deployment_issues.md` | LL-003, LL-004, LL-011, LL-021, LL-024, LL-032, LL-060 |
| `reports/2026-04-01-deploy-backend-dokploy.md` | LL-070, LL-071, LL-072, LL-075 |
| `reports/2026-07-08-notas-workspace-etiquetas-no-se-guardaban.md` | LL-046 |
| `reports/2026-04-03-deploy-frontend-admin-dokploy.md` | LL-070, LL-073, LL-074, LL-075, LL-079 |
| `reports/2026-04-03-deploy-frontend-next-vista-dokploy.md` | LL-070, LL-073, LL-076, LL-077, LL-078 |
| `reports/2026-04-03-deploy-frontend-workspace-dokploy.md` | LL-070, LL-073, LL-074, LL-078, LL-079 |
| `reports/2026-04-04-deploy-desktop-produccion.md` | LL-031 (caso prod), LL-090, LL-091 |
| `reports/2026-02-27-backend-status.md` | (sin entradas — reporte de estado/roadmap, sin incidencias reutilizables) |
| memoria PASO 21 (Admin Panel 403/404) | LL-061 |

## Reportes digeridos sin entradas nuevas

- `reports/2026-02-27-backend-status.md` — reporte de estado del backend (progreso de roadmap,
  cobertura de tests, deuda técnica temprana). No documenta incidencias resueltas reutilizables;
  su deuda técnica ya está trazada en el roadmap. Revisar de nuevo solo si reaparece algún punto
  (p.ej. `mfa_secret` en plaintext → cifrar) como incidencia real.

## Pendientes de digerir

(ninguno — todos los reportes de `reports/` y `reports/varios/` han sido procesados a la fecha)

`reports/2026-06-17-feature-gates-analysis.md` es un documento de análisis (no de incidencia);
no genera entradas de lecciones, pero su deuda técnica está rastreada en `BACKLOG.md`.
