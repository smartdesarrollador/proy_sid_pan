# Database Normalization Backfill Scripts

Scripts para migrar datos de campos JSONB a tablas normalizadas.

## Requisitos

```bash
pip install psycopg2-binary click tqdm
```

## Scripts Disponibles

### 1. backfill_plan_features.py
Migra `Plan.features` JSONB → `PlanFeature` table

```bash
# Dry-run (no commits)
python scripts/normalization/backfill_plan_features.py --dry-run

# Execute migration
python scripts/normalization/backfill_plan_features.py

# Custom DB URL
python scripts/normalization/backfill_plan_features.py --db-url="postgresql://user:pass@host/db"
```

### 2. backfill_event_reminders.py
Migra `Event.reminders` JSONB → `EventReminder` table

### 3. backfill_task_tags.py
Migra `Task.tags` JSONB → `TaskTag` table

### 4. backfill_file_tags.py
Migra `File.tags` JSONB → `FileTag` table

### 5. backfill_comment_mentions.py
Migra `TaskComment.mentions` JSONB → `TaskCommentMention` table

### 6. backfill_audit_log_changes.py
Migra `AuditLog.changes` JSONB → `AuditLogChange` table

### 7. backfill_resource_shares.py
Migra `Share` table → tablas específicas (`ProjectShare`, `TaskShare`, etc.)

## Orden de Ejecución

**IMPORTANTE:** Ejecutar en este orden:

1. `backfill_plan_features.py`
2. `backfill_event_reminders.py`
3. `backfill_task_tags.py` y `backfill_file_tags.py` (paralelo)
4. `backfill_comment_mentions.py`
5. `backfill_audit_log_changes.py`
6. `backfill_resource_shares.py` (último, más crítico)

## Validación Post-Migración

Cada script incluye validación automática que compara:
- Número de registros en JSONB vs tabla
- Integridad de datos
- Foreign keys válidas

### Validación Manual

```sql
-- Verificar plan features
SELECT
    (SELECT COUNT(*) FROM plan WHERE features != '{}') as jsonb_count,
    (SELECT COUNT(DISTINCT plan_id) FROM plan_feature) as table_count;

-- Verificar event reminders
SELECT
    (SELECT COUNT(*) FROM event WHERE reminders != '{}') as jsonb_count,
    (SELECT COUNT(DISTINCT event_id) FROM event_reminder) as table_count;

-- Verificar task tags
SELECT
    (SELECT COUNT(*) FROM task WHERE tags != '[]') as jsonb_count,
    (SELECT COUNT(DISTINCT task_id) FROM task_tag) as table_count;
```

## Rollback

Si la migración falla, los datos originales permanecen intactos en los campos JSONB.

Para revertir:

```sql
-- Truncate new tables
TRUNCATE plan_feature CASCADE;
TRUNCATE event_reminder CASCADE;
TRUNCATE task_tag CASCADE;
TRUNCATE file_tag CASCADE;
-- etc.
```

## Dual-Write Pattern

Después del backfill, activar dual-write en la aplicación:

```python
# Django model ejemplo
class Plan(models.Model):
    features = models.JSONField()  # Mantener temporalmente

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        # Dual-write: actualizar tabla normalizada
        if self.features:
            for code, enabled in self.features.items():
                PlanFeature.objects.update_or_create(
                    plan=self,
                    feature_code=code,
                    defaults={'is_enabled': enabled}
                )
```

## Logs y Monitoreo

Cada script genera logs detallados:

```bash
python backfill_plan_features.py 2>&1 | tee migration_plan_features.log
```

## Testing en Staging

**⚠️ NUNCA ejecutar directamente en producción sin probar en staging**

1. Backup completo de la base de datos
2. Ejecutar en ambiente de staging
3. Validar por 1 semana
4. Monitorear performance y errores
5. Solo entonces ejecutar en producción

## Performance

Tiempos estimados (100k registros):

| Script | Tiempo | RAM |
|--------|--------|-----|
| plan_features | ~2 min | 50 MB |
| event_reminders | ~5 min | 100 MB |
| task_tags | ~10 min | 200 MB |
| audit_log_changes | ~30 min | 500 MB |
| resource_shares | ~15 min | 300 MB |

## Troubleshooting

### Error: "duplicate key violation"
- Run con `--batch-size=1` para encontrar registro problemático
- Verificar constraints UNIQUE en tablas

### Error: "foreign key violation"
- Verificar que registros referenciados existen
- Puede haber datos huérfanos (orphaned records)

### Script muy lento
- Aumentar `--batch-size` (default: 100, máximo: 1000)
- Verificar índices en tablas origen

### Out of memory
- Reducir `--batch-size`
- Ejecutar por lotes con `--offset` y `--limit`

## Contacto

Para problemas o dudas: tech-team@company.com
