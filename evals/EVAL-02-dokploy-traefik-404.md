# EVAL-02 — Diagnosticar un 404 de Traefik en Dokploy

**Skill objetivo:** `dokploy-deploy`
**Tipo:** troubleshoot
**Qué mide:** que el agente reconozca el patrón de despliegue del proyecto (Dokploy + Traefik) y vaya a la causa documentada, en vez de proponer un diagnóstico genérico.

## Prompt (pegar tal cual en una sesión NUEVA del repo)

> Acabo de desplegar una app frontend nueva en Dokploy y al entrar al dominio me sale un "404 page not found" en texto plano (no es la página de la app). El contenedor está corriendo. ¿Qué reviso?

## Rúbrica (puntuar cada ítem: ✅1 / 🟡0.5 / ❌0 → total /8)

- [ ] Invocó/siguió el skill `dokploy-deploy` (o citó su conocimiento).
- [ ] Identificó que el 404 en texto plano es **respuesta de Traefik**, no de la app.
- [ ] Causa raíz correcta: faltan labels de Traefik o la label `traefik.http.routers.<NAME>.service=<NAME>`.
- [ ] Explicó que en servicios **Compose** Dokploy NO inyecta labels automáticamente (hay que ponerlos a mano).
- [ ] Recordó verificar la red `dokploy-network` (app + `dokploy-traefik`).
- [ ] Dio el comando para listar routers en Traefik (`docker exec dokploy-traefik wget -qO- http://localhost:8080/api/http/routers`).
- [ ] Citó la entrada **LL-070** de `lessons-learned` (o la referenció).
- [ ] No se fue por una pista genérica equivocada como primera hipótesis (DNS, certificado SSL, puerto de la app) sin antes revisar los labels.

## Señales de fallo (qué revisar si puntúa bajo → observability ligera)

- Propuso causas genéricas (DNS/SSL/firewall) antes que los labels → reforzar la regla de oro #1 en `dokploy-deploy/SKILL.md`.
- No mencionó la label `.service=` → resaltarla en la plantilla de labels de las referencias.
- No abrió la referencia correcta (`troubleshooting.md` / la del tipo de app) → revisar la tabla de selección del SKILL.md.

## Cómo correrlo

1. Sesión nueva de Claude Code en la raíz del repo.
2. Pegar el Prompt.
3. Marcar la rúbrica y sumar el puntaje.
4. Anotar fecha + puntaje en [`RESULTS.md`](RESULTS.md).
