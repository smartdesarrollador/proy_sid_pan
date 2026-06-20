---
name: update-backlog
description: Actualiza el BACKLOG.md del proyecto RBAC Subscription Platform. Usar cuando el usuario dice "actualiza el backlog", "marca como completado", "agrega deuda técnica", "agrega idea de feature", "rotamos el backlog", o cualquier variación de actualizar el estado del proyecto en BACKLOG.md.
---

# Update Backlog

Skill para mantener `BACKLOG.md` organizado y al día.

## Reglas del BACKLOG

El archivo tiene 4 secciones en este orden:

```
## 3 Últimas tareas realizadas   ← máx. 3 entradas, rotar al agregar nueva
## Pendientes activos            ← lo que se retoma la próxima sesión
## Deuda técnica                 ← no urgente pero no ignorar
## Ideas de feature              ← sin fecha de compromiso
```

Ver estructura detallada en `references/estructura.md`.

## Flujo según el tipo de actualización

### Tarea completada

1. Leer `BACKLOG.md` para ver el estado actual.
2. Eliminar el ítem de la sección donde estaba (Pendientes / Deuda / Ideas).
3. Rotar "3 Últimas tareas realizadas": agregar la nueva al tope, eliminar la más antigua si ya hay 3.
4. Formato de entrada en "Últimas tareas":
   ```
   - **YYYY-MM-DD — Nombre descriptivo** ✅
     Una o dos líneas de qué se hizo y qué impacto tuvo.
     _→ [Reporte](reports/YYYY-MM-DD-nombre.md) · [ADR-00X](docs/adr/00X-nombre.md)_ (si aplica)
   ```
5. Si hay reporte en `reports/` o ADR en `docs/adr/`, enlazarlo.

### Nueva deuda técnica

Agregar al final de "## Deuda técnica":
```
- [ ] Descripción concisa del problema.
      _Origen: [reports/fecha-reporte.md](reports/fecha-reporte.md)_ (si aplica)
```

### Nueva idea de feature

Agregar al final de "## Ideas de feature":
```
- [ ] Descripción de la idea y su valor.
```

### Ítem de pendientes activos

- Para **agregar**: poner al tope de la lista (lo más importante primero).
- Para **eliminar**: quitar el ítem y moverlo a "Últimas tareas" si se completó.

## Reglas de formato

- Nunca dejar `[x]` en las secciones — los completados van a "Últimas tareas" y se borran del resto.
- Mantener las entradas de "Últimas tareas" en máx. 3 líneas de texto más el link.
- Los links a reportes usan rutas relativas desde la raíz del proyecto.
- Fechas siempre en formato `YYYY-MM-DD`.
- No agregar nueva sección ni cambiar el orden de las existentes.

## Pasos de ejecución

1. `Read BACKLOG.md` para ver estado actual.
2. Determinar qué sección(es) cambian según el tipo de actualización.
3. Aplicar los cambios con `Edit` (no reescribir el archivo completo salvo que haya múltiples cambios en distintas secciones).
4. Confirmar al usuario qué cambió (una línea por sección modificada).
