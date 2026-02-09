# Angular Real-Time Skill

Skill completo para implementar comunicación real-time robusta en proyectos Angular standalone con WebSockets, SSE y notificaciones.

## Características Principales

✅ **WebSocket Service** genérico con auto-reconnection
✅ **Server-Sent Events (SSE)** para updates unidireccionales
✅ **Notification System** con toast notifications
✅ **Connection Status** monitoring con signals
✅ **Auto-Reconnection** con exponential backoff
✅ **Heartbeat/Ping-Pong** para keep-alive
✅ **Message Queue** durante desconexión offline
✅ **Typing Indicators** para chat applications
✅ **Online/Offline Status** de usuarios
✅ **Real-Time Data Sync** con APIs
✅ **Connection Indicator** UI component
✅ **Retry Logic** resiliente con circuit breaker
✅ **Event Emitter** system con RxJS
✅ **Testing** con mock WebSocket

## Contenido del Skill

### Archivo Principal
- `SKILL.md` - Documentación completa con código production-ready

### Referencias Adicionales
- `references/PROTOCOLS.md` - WebSockets vs SSE vs Long Polling
- `references/PATTERNS.md` - Patterns y best practices (backoff, queues, heartbeat)

### Ejemplos
- `assets/example-implementations.ts` - 6 casos de uso completos

## Servicios Incluidos

1. **WebSocketService** - Servicio genérico con:
   - Auto-reconnection con exponential backoff
   - Heartbeat/ping-pong keep-alive
   - Message queue para mensajes offline
   - Connection state management con signals
   - Estadísticas de conexión (uptime, mensajes, latencia)
   - Filtrado de mensajes por tipo
   - Error handling robusto

2. **SSEService** - Server-Sent Events con:
   - Auto-reconnection nativa
   - Event listeners por tipo
   - State management
   - Compatibilidad HTTP estándar

3. **NotificationService** - Notificaciones real-time con:
   - Toast notifications con Tailwind
   - Signals para estado reactivo
   - Prioridades (info, success, warning, error)
   - Auto-close configurable
   - Sonido opcional
   - Queue management

4. **ConnectionStatusService** - Monitoreo de conexión con:
   - WebSocket state tracking
   - Online/offline detection
   - Computed signals para UI
   - Estadísticas detalladas

## Componentes UI

1. **ConnectionStatusComponent** - Indicador visual de conexión
2. **ToastNotificationComponent** - Notificaciones toast animadas

## Modelos Tipados

- `MessageType` - Enum de tipos de mensaje
- `Payload<T>` - Payload genérico tipado
- `ConnectionState` - Estados de conexión
- `WebSocketConfig` - Configuración de WebSocket
- `SSEConfig` - Configuración de SSE
- `RealTimeNotification` - Notificación tipada

## Cuándo Usar Este Skill

Usa este skill cuando necesites:
- Chat en tiempo real
- Notificaciones push
- Live dashboards
- Collaborative editing
- Presence/online status
- Real-time updates (feeds, stocks, etc.)
- Progress tracking
- Live data synchronization
- Multiplayer features
- IoT monitoring

## Inicio Rápido

### WebSocket Basic

```typescript
import { WebSocketService } from './core/services/websocket.service';

constructor(private ws: WebSocketService) {}

ngOnInit() {
  // Conectar
  this.ws.connect({
    url: 'wss://api.example.com/realtime',
    autoReconnect: true,
    heartbeat: true
  });

  // Escuchar mensajes
  this.ws.messages$.subscribe(msg => {
    console.log('Message:', msg);
  });

  // Filtrar por tipo
  this.ws.onMessage(MessageType.TEXT).subscribe(msg => {
    console.log('Text message:', msg.data);
  });

  // Enviar mensaje
  this.ws.send({
    type: MessageType.TEXT,
    data: { message: 'Hello!' },
    timestamp: new Date().toISOString()
  });
}

ngOnDestroy() {
  this.ws.disconnect();
}
```

### SSE Basic

```typescript
import { SSEService } from './core/services/sse.service';

constructor(private sse: SSEService) {}

ngOnInit() {
  this.sse.connect({
    url: 'https://api.example.com/events'
  });

  // Escuchar evento específico
  this.sse.onEvent('notification').subscribe(data => {
    console.log('Notification:', data);
  });
}
```

### Notifications

```typescript
import { NotificationService } from './core/services/notification.service';

constructor(private notifications: NotificationService) {}

showNotification() {
  this.notifications.success(
    'Éxito',
    'Operación completada correctamente',
    5000
  );
}
```

## Stack Tecnológico

- **Angular 19+** - Framework principal
- **Standalone Components** - Arquitectura moderna
- **Signals** - State management reactivo
- **RxJS** - Observable patterns
- **WebSocket API** - Comunicación bidireccional nativa
- **EventSource API** - SSE nativo
- **Tailwind CSS** - Styling de componentes UI
- **TypeScript** - Type safety completo

## Protocolos Soportados

### WebSocket
- Comunicación full-duplex bidireccional
- Baja latencia
- Ideal para: chat, gaming, collaborative editing

### Server-Sent Events (SSE)
- Comunicación unidireccional (servidor → cliente)
- Auto-reconnection nativa
- Ideal para: notifications, live feeds, monitoring

### Fallback Strategy
El skill incluye patrones para implementar fallback progresivo:
1. WebSocket (primera opción)
2. SSE (segunda opción)
3. Long Polling (última opción)

## Patterns Implementados

### Reconnection Strategies
- **Exponential Backoff** - Incremento exponencial de delay
- **Jittered Backoff** - Con aleatoriedad para evitar thundering herd
- **Linear Backoff** - Incremento lineal predecible
- **Circuit Breaker** - Prevenir reconexiones infinitas

### Message Patterns
- **Offline Queue** - Cola de mensajes cuando está offline
- **Priority Queue** - Mensajes con diferentes prioridades
- **Optimistic Updates** - Actualizar UI antes de confirmación
- **Debouncing** - Para typing indicators y scroll

### Keep-Alive
- **Simple Ping-Pong** - Heartbeat básico
- **Adaptive Heartbeat** - Ajustar frecuencia según actividad
- **Timeout Detection** - Detectar conexiones muertas

## Casos de Uso Incluidos

1. **Live Dashboard** - Métricas en tiempo real
2. **Notifications** - Sistema de notificaciones push
3. **Presence** - Estado online/offline de usuarios
4. **Collaborative Editing** - Edición colaborativa con typing indicators
5. **Live Feed** - Feed de actualizaciones con SSE
6. **Progress Tracking** - Seguimiento de tareas en progreso

## Backend Compatible

Incluye ejemplos completos para:
- Node.js con `ws` library
- Socket.io
- Express.js SSE endpoints
- Message broadcasting
- Room/channel management

## Security Best Practices

- ✅ Autenticación con JWT tokens
- ✅ Validación de mensajes
- ✅ Rate limiting
- ✅ WSS (WebSocket Secure)
- ✅ CORS configuration
- ✅ Message sanitization

## Performance Optimizations

- ✅ Message batching
- ✅ Connection pooling
- ✅ Debouncing/throttling
- ✅ Lazy subscription
- ✅ Automatic cleanup

## Testing

Incluye ejemplos de:
- Unit testing con mock WebSocket
- jest-websocket-mock integration
- Connection state testing
- Message flow testing
- Reconnection logic testing

## Browser Support

- Chrome/Edge ✅
- Firefox ✅
- Safari ✅
- Opera ✅
- IE11 ❌ (usar polyfills o fallback)

## Autor

Creado para proyectos Angular enterprise-ready con comunicación real-time robusta y resiliente.

## Licencia

Úsalo libremente en proyectos personales y comerciales.
