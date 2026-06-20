# Estructura del BACKLOG.md

## Encabezado

El archivo empieza con una descripción de su propósito y la relación con `pending/`, `plans/`, `roadmaps/` y `reports/`. No modificar ese bloque.

## Sección: 3 Últimas tareas realizadas

Referencia rápida de las 3 últimas cosas completadas, para no tener que abrir `reports/`.

- Máximo 3 entradas.
- Orden: la más reciente al tope.
- Al agregar una nueva: la más antigua de las 3 se elimina (su detalle ya vive en `reports/`).
- Cada entrada: fecha + título + 1-2 líneas de resumen + links a reporte/ADR si existen.

```markdown
## 3 Últimas tareas realizadas

> Referencia rápida — ver detalles completos en [`reports/`](reports/).

- **2026-06-20 — Chat IA con RAG liviano** ✅
  Widget flotante en toda la app Hub. RAG liviano con PostgreSQL + `gpt-4o-mini`.
  Gestión de KB desde Admin Panel. 10 artículos cargados en producción.
  _→ [Reporte](reports/2026-06-20-implementacion-chat-ia.md) · [ADR-005](docs/adr/005-chat-ia-rag-liviano.md)_
```

## Sección: Pendientes activos

Lo que se retoma la próxima vez que se abre el proyecto. Orden de prioridad: lo más urgente primero.

- Ítems con `- [ ]`.
- Sin fecha de vencimiento (si necesita fecha → va en `plans/`).
- Al completarse: se borra de aquí y se agrega a "Últimas tareas realizadas".

## Sección: Deuda técnica

No es urgente pero si no se corrige puede dar problemas después.

- Ítems con `- [ ]`.
- Incluir origen con link al reporte si lo hay.
- Al resolverse: se borra de aquí y se agrega a "Últimas tareas realizadas".

## Sección: Ideas de feature

Sería bueno tenerlo, sin compromiso de fecha.

- Ítems con `- [ ]`.
- Al implementarse: se borra de aquí y se agrega a "Últimas tareas realizadas".
- NO usar `[x]` — los completados se eliminan de esta lista directamente.
