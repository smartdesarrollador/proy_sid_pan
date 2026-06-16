# ADR-004: Pago Manual vía Yape con Verificación Asistida por IA + Telegram

- **Estado**: Aceptado
- **Fecha**: 2026-06-15
- **Autor**: Equipo de desarrollo

---

## Contexto

Los tenants pueden registrarse con un plan pagado (Starter / Professional / Enterprise), pero el proyecto no cuenta con una pasarela de pago automatizada integrada (Stripe, Culqi, etc.). El mercado objetivo inicial es Perú, donde **Yape** (billetera digital) es un medio de pago ampliamente adoptado, mientras que las pasarelas tradicionales:

1. Tienen comisiones relativamente altas para montos pequeños/medianos típicos de un SaaS en etapa temprana
2. Requieren integración, cuenta empresarial verificada y cumplimiento adicional (KYC, PCI) antes de poder cobrar
3. No siempre tienen buena adopción/confianza en el segmento de clientes objetivo (pequeños negocios/freelancers en Perú)

Se necesitaba un mecanismo que permitiera:
- Cobrar planes pagados sin integrar una pasarela desde el día uno
- Verificar que el comprobante de pago sea legítimo sin que un humano tenga que estar mirando una bandeja de soporte constantemente
- Mantener al tenant con acceso (al menos al plan Free) mientras se revisa el pago, en lugar de bloquearlo por completo
- Dejar una puerta abierta para migrar a una pasarela automatizada más adelante sin rehacer el modelo de datos

---

## Decisión

Se implementa un flujo de **pago manual vía Yape con verificación asistida por IA y aprobación humana por Telegram**:

1. El tenant se registra con un plan pagado → el tenant **arranca en plan Free** y el pago solicitado queda registrado como `Subscription.status = 'pending_payment'` (no se bloquea el acceso del usuario)
2. El Hub muestra los datos de Yape (número + titular, configurables vía `YapeConfig` en BD) y permite subir un comprobante (screenshot)
3. El comprobante se sube a `POST /api/v1/auth/yape-payment-proof`, se crea un `YapePaymentProof` con un `admin_token` aleatorio, y se dispara un webhook hacia n8n
4. n8n analiza la imagen con **OpenAI Vision** (extrae monto, fecha, destinatario, autenticidad aparente) y envía un mensaje a un grupo de Telegram con dos botones: `✅ APROBAR CUENTA` / `❌ RECHAZAR PAGO`
5. Un administrador humano revisa el análisis de IA + la imagen y hace clic en aprobar o rechazar
6. El backend activa (`tenant.plan = plan_pagado`, `status = 'active'`) o rechaza (`tenant.plan` permanece `'free'`) la suscripción, y notifica al usuario por email

### Por qué IA + humano y no solo IA, ni solo humano

- **Solo IA (auto-aprobación)**: insuficiente para esta etapa — el análisis de Vision puede equivocarse con comprobantes falsificados o ambiguos, y un error significa activar un plan pagado sin que realmente se haya pagado
- **Solo humano (sin IA)**: el admin tendría que abrir cada imagen, leer manualmente monto/fecha/destinatario y decidir — la IA reduce esa carga a una validación rápida de un resumen ya extraído
- **Híbrido (elegido)**: la IA hace el trabajo pesado de extracción/análisis: el humano conserva la decisión final, que es donde más importa tener criterio ante fraude

---

## Alternativas consideradas

### A. Integrar una pasarela de pago automatizada (Stripe / Culqi) desde el inicio
- ✅ Activación inmediata, sin intervención manual
- ✅ Estándar de la industria, mejor trazabilidad contable
- ❌ Comisiones más altas relativas al ticket promedio esperado en esta etapa
- ❌ Tiempo de integración + cumplimiento (KYC empresarial) antes de poder cobrar el primer plan pagado
- ❌ Yape no es soportado nativamente por estas pasarelas en Perú; requeriría que el cliente tenga tarjeta, lo cual reduce conversión en el segmento objetivo
- **Recomendado como evolución futura**, no como reemplazo total — puede convivir con Yape para clientes que prefieran tarjeta

### B. Aprobación 100% automática basada solo en el análisis de IA
- ✅ Cero intervención humana, activación instantánea
- ❌ Sin red de seguridad ante comprobantes falsificados o el modelo de IA equivocándose
- ❌ Riesgo de negocio alto: un tenant accede a un plan pagado sin haber pagado realmente

### C. Bandeja de revisión manual en el Admin Panel (sin Telegram)
- ✅ Todo dentro del propio sistema, sin depender de un servicio externo (Telegram)
- ❌ Requiere que el admin esté revisando el panel activamente; sin notificación push, los comprobantes pueden quedar sin revisar por horas/días
- ❌ Implica construir una UI de revisión completa antes de poder lanzar el flujo de pago
- **Posible complemento futuro**: el Admin Panel ya puede ver los `YapePaymentProof` vía `yape_admin_views.py`; Telegram es el canal de notificación rápida, no el único punto de revisión

### D. Bloquear completamente el acceso del usuario hasta que se apruebe el pago
- ✅ Modelo más simple: no hay "plan intermedio"
- ❌ Mala experiencia: un usuario que apenas se registra y sube su comprobante se queda sin poder usar nada mientras espera revisión, que puede tardar horas
- ❌ Fue, de hecho, el diseño original y causó el bug documentado en `reports/2026-06-15-implementacion-pago-yape.md` — la lógica de "bloquear con `is_active=False`" no era equivalente a "mantener el plan en Free", y terminó dejando expuesto el plan pagado sin aprobación

---

## Consecuencias

### Positivas
- Permite monetizar planes pagados sin integrar una pasarela compleja desde el día uno
- El usuario nunca queda completamente bloqueado — accede a Free de inmediato mientras se revisa su pago
- La verificación por IA reduce significativamente el esfuerzo de revisión manual sin delegarle la decisión final
- El modelo de datos (`Subscription.status`, `YapePaymentProof`) es independiente del canal de pago — migrar a Stripe/Culqi en el futuro no requeriría rediseñar el estado de suscripción, solo agregar otro origen de verificación

### Negativas / limitaciones conocidas
- La aprobación depende de que un humano esté disponible y revise Telegram — no hay SLA garantizado de activación
- El `admin_token` de `YapePaymentProof` no tiene expiración (TTL) — un link de aprobación/rechazo queda vigente indefinidamente si no se actúa sobre él (ver deuda técnica en `BACKLOG.md`)
- El canal de aprobación (links de un clic vía GET/POST) requiere disciplina de seguridad: cualquier sistema de mensajería que genere previsualizaciones de links (Telegram, WhatsApp, escáneres de email) puede disparar un GET no intencional. Se mitigó con el patrón GET-confirmación / POST-acción (ver `reports/2026-06-15-implementacion-pago-yape.md`), pero es una superficie de riesgo a vigilar si se agregan nuevos canales de notificación
- No escala bien a un volumen alto de registros simultáneos con plan pagado — depende de capacidad humana de revisión

### Mejora futura recomendada
- Agregar TTL a los `admin_token` y una alerta en el Admin Panel para tenants en `pending_payment` con más de N días sin revisión (ya registrado en `BACKLOG.md`)
- Si el volumen de pagos crece, evaluar la Alternativa A (pasarela automatizada) como canal adicional — no como reemplazo de Yape, dado que sigue siendo el método de pago preferido del segmento objetivo en Perú
