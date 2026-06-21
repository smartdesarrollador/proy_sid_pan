# ADR-006: Trial Gratuito de 30 Días del Plan Professional

- **Estado**: Aceptado
- **Fecha**: 2026-06-21
- **Autor**: Equipo de desarrollo

---

## Contexto

Se necesitaba implementar un período de prueba gratuito del plan Professional para:

1. Reducir la fricción de conversión — un usuario puede probar el plan completo antes de pagar
2. Diferenciarse de competidores que solo ofrecen trial con tarjeta de crédito
3. Ser compatible con el flujo de pago manual vía Yape ya implementado (ADR-004) — el trial no debe pasar por el flujo de comprobante

Las preguntas de diseño no triviales eran:

- **¿Dónde guardar la restricción "ya usó el trial"?** — en `Tenant`, en `Subscription`, o en `User`
- **¿A qué planes aplica el trial?** — solo Free, o también Starter
- **¿Cómo se maneja la expiración?** — Celery, cron externo, o señal al momento de login
- **¿Qué pasa al vencer el trial?** — ¿cuál es el plan de destino del downgrade?

---

## Decisión

### 1. El flag `professional_trial_used` vive en `Tenant`, no en `Subscription` ni en `User`

Se agrega `professional_trial_used = BooleanField(default=False)` directamente al modelo `Tenant`.

**Razón**: la restricción "un solo trial por organización" es una política de negocio que aplica a la organización completa, no a un usuario individual ni a una instancia de suscripción. Si el flag viviera en `Subscription`, podría resetearse al cancelar y recrear la suscripción. Si viviera en `User`, un Owner podría crear un nuevo usuario admin y activar un segundo trial. En `Tenant` el flag persiste independientemente de los cambios en suscripción o usuarios.

### 2. El trial solo está disponible para tenants con plan Free

`StartTrialView` y `RegisterSerializer` validan `tenant.plan == 'free'` antes de activar el trial.

**Razón**: simplifica el downgrade al vencer. Si el trial está restringido a Free, al vencer siempre se vuelve a `plan='free'` — no hay ambigüedad sobre el plan de destino. Si se permitiera trial desde Starter, al vencer habría que recordar el plan anterior y restaurarlo, lo cual añade complejidad (¿y si cambió entre tanto? ¿y si el plan anterior ya no existe?).

### 3. La expiración se maneja con Celery Beat (crontab diario)

Dos tareas periódicas en `apps/subscriptions/tasks.py`:

- `expire_professional_trials` — corre a las 4AM, busca suscripciones con `status='trialing'` y `trial_end <= now()`, hace downgrade a Free por tenant en una transacción atómica, envía email
- `remind_professional_trial_expiry` — corre a las 10AM, busca suscripciones con `trial_end` en la ventana `[now+6d, now+8d]`, envía recordatorio de 7 días

**Razón**: la verificación en tiempo de login (comprobar `trial_end` en cada request) es frágil — el tenant seguiría con permisos de Professional hasta el próximo login después del vencimiento, lo que crea una ventana de tiempo indeterminada. Celery Beat garantiza que el downgrade ocurre dentro de las primeras 24 horas del vencimiento, independientemente de si el usuario se conecta o no.

La ventana de ±1 día en el recordatorio (`[now+6d, now+8d]` en lugar de exactamente `now+7d`) absorbe el jitter natural del scheduler y evita que el task se salte el día exacto si hay un restart del worker o una carga de sistema alta.

### 4. El trial activa Subscription.status = 'trialing' (no 'active')

El campo `Subscription.status` toma el valor `'trialing'` durante el período de prueba, diferente de `'active'` que corresponde a un plan pagado.

**Razón**: permite distinguir en reportes y en el Admin Panel entre clientes que pagan y clientes que están en prueba. También facilita consultas como "¿cuántos trials están a punto de vencer?" sin necesidad de cruzar con fechas y estados combinados. En el Admin Panel (`ClientSubscriptionSerializer`), el status `'trialing'` se mapea a `'trial'` para el frontend y el MRR se reporta como `$0` (no como el precio del plan).

---

## Alternativas consideradas

### A. Flag en `Subscription` en lugar de `Tenant`

- ✅ Más cercano al concepto de suscripción
- ❌ Se resetea si la suscripción se cancela y recrea — permite abusar del trial
- ❌ Requiere JOIN adicional para validar elegibilidad

### B. Permitir trial desde cualquier plan (Free y Starter)

- ✅ Más generoso, más conversiones potenciales desde Starter
- ❌ Al vencer hay que saber a qué plan volver — añade lógica de "plan anterior" que no existe en el modelo actual
- ❌ Un tenant en Starter que activa un trial y lo deja vencer quedaría en Free (downgrade inesperado) a menos que se guarde el plan original

### C. Expiración verificada en tiempo de request (middleware/permiso)

- ✅ Sin dependencia de Celery Beat ni cron
- ❌ El tenant mantiene permisos de Professional hasta el próximo request después del vencimiento
- ❌ Si el tenant no se conecta por días, el plan nunca expira en la BD — inconsistencia reportable desde el Admin Panel
- ❌ Añade latencia a cada request autenticado

### D. Expiración con señal de Django o post_save en el modelo

- ✅ Reacción inmediata al llegar a `trial_end`
- ❌ Django no tiene un scheduler de señales diferidas nativo — requeriría un cron externo o consulta periódica de todos modos
- ❌ El modelo no tiene forma de disparar código en una fecha futura sin que algo externo lo consulte

---

## Consecuencias

### Positivas
- Un solo flag en `Tenant` es la fuente de verdad para la política de "un trial por organización", independiente de cancelaciones o recreaciones de suscripción
- El downgrade al vencer siempre es a Free — sin ambigüedad de plan de destino
- `status='trialing'` permite distinguir clientes pagadores de clientes en prueba en reportes y métricas (MRR real vs. MRR proyectado)
- El flujo de registro con trial evita completamente el paso de Yape — mejor experiencia de onboarding

### Negativas / limitaciones conocidas
- El downgrade puede tardar hasta 24 horas desde el vencimiento exacto (según el horario del crontab y zona horaria del servidor)
- El email de expiración usa `send_mail` con texto plano — no tiene template HTML consistente con el resto de comunicaciones (ver deuda técnica en `BACKLOG.md`)
- No hay panel en el Admin para ver tenants en trial con vencimiento próximo — útil para seguimiento comercial y outreach proactivo (ver `BACKLOG.md`)
- Si en el futuro se quiere ofrecer trial desde Starter, habría que agregar un campo `previous_plan` en `Subscription` o cambiar la restricción — este ADR deberá revisarse en ese momento

### Mejora futura recomendada
- Panel en Admin Panel con vista de "trials activos" ordenados por fecha de vencimiento, con indicador de días restantes — oportunidad de contacto comercial proactivo antes del vencimiento
- Si el volumen de trials crece, considerar email de bienvenida al inicio del trial (actualmente solo hay email al vencer y recordatorio a 7 días)
