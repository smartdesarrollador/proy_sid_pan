# Protocolos de Comunicación Real-Time

## WebSockets vs SSE vs Long Polling

### WebSockets

**Características:**
- Comunicación bidireccional full-duplex
- Conexión persistente
- Baja latencia
- Soporte para binario
- Protocolo: `ws://` o `wss://` (seguro)

**Cuándo usar:**
- Chat en tiempo real
- Juegos multiplayer
- Edición colaborativa
- Trading/dashboards financieros
- Notificaciones bidireccionales

**Ejemplo:**
```typescript
const ws = new WebSocket('wss://api.example.com/realtime');

ws.onopen = () => {
  console.log('Connected');
  ws.send(JSON.stringify({ type: 'subscribe', channel: 'updates' }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

ws.onclose = () => {
  console.log('Disconnected');
};
```

**Pros:**
- ✅ Bidireccional
- ✅ Muy eficiente
- ✅ Baja latencia
- ✅ Eventos del servidor y cliente

**Cons:**
- ❌ Más complejo de implementar
- ❌ Requiere servidor compatible
- ❌ Proxies/firewalls pueden bloquear
- ❌ Scaling más difícil

---

### Server-Sent Events (SSE)

**Características:**
- Comunicación unidireccional (servidor → cliente)
- Sobre HTTP/HTTPS estándar
- Auto-reconnection nativa
- Solo texto (no binario)
- Protocolo: `http://` o `https://`

**Cuándo usar:**
- Notificaciones del servidor
- Live feeds (noticias, stocks)
- Progress updates
- Monitoring dashboards
- Eventos de log en tiempo real

**Ejemplo:**
```typescript
const eventSource = new EventSource('https://api.example.com/events');

// Evento por defecto
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data);
};

// Evento custom
eventSource.addEventListener('notification', (event) => {
  const data = JSON.parse(event.data);
  console.log('Notification:', data);
});

eventSource.onerror = (error) => {
  console.error('SSE error:', error);
};
```

**Backend (Express.js):**
```javascript
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Enviar evento
  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Enviar cada 5 segundos
  const interval = setInterval(() => {
    sendEvent({ message: 'Update', timestamp: Date.now() });
  }, 5000);

  req.on('close', () => {
    clearInterval(interval);
  });
});
```

**Pros:**
- ✅ Simple de implementar
- ✅ Funciona con HTTP estándar
- ✅ Auto-reconnection incorporada
- ✅ Mejor compatibilidad con proxies

**Cons:**
- ❌ Solo servidor → cliente
- ❌ Solo texto (no binario)
- ❌ Límite de conexiones HTTP (6 por dominio en algunos browsers)
- ❌ No soportado en IE/Edge legacy

---

### Long Polling

**Características:**
- Request HTTP que espera respuesta
- Cliente reinicia request inmediatamente
- Basado en HTTP tradicional
- Funciona en todos los navegadores

**Cuándo usar:**
- Fallback cuando WebSocket/SSE no están disponibles
- Compatibilidad con navegadores antiguos
- Redes restrictivas que bloquean WebSockets

**Ejemplo:**
```typescript
async function longPoll() {
  try {
    const response = await fetch('https://api.example.com/poll', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();
    console.log('Update:', data);

    // Reiniciar inmediatamente
    longPoll();

  } catch (error) {
    console.error('Poll error:', error);
    // Retry después de delay
    setTimeout(longPoll, 5000);
  }
}

longPoll();
```

**Backend (Express.js):**
```javascript
const waitingClients = [];

app.get('/poll', (req, res) => {
  // Agregar cliente a lista de espera
  waitingClients.push(res);

  // Timeout después de 30s
  req.setTimeout(30000, () => {
    const index = waitingClients.indexOf(res);
    if (index > -1) {
      waitingClients.splice(index, 1);
      res.json({ message: 'timeout' });
    }
  });
});

// Cuando hay update, notificar todos los clientes
function notifyClients(data) {
  waitingClients.forEach(res => {
    res.json(data);
  });
  waitingClients.length = 0;
}
```

**Pros:**
- ✅ Compatible con todos los navegadores
- ✅ Funciona con firewalls/proxies
- ✅ Simple de implementar

**Cons:**
- ❌ Alta latencia
- ❌ Ineficiente (muchas requests)
- ❌ Mayor carga en servidor
- ❌ No es real-time verdadero

---

## Tabla Comparativa

| Feature | WebSocket | SSE | Long Polling |
|---------|-----------|-----|--------------|
| Dirección | Bidireccional | Servidor → Cliente | Bidireccional |
| Protocolo | ws:// wss:// | http:// https:// | http:// https:// |
| Latencia | Muy baja | Baja | Alta |
| Eficiencia | Alta | Media-Alta | Baja |
| Browser support | Moderno | Moderno (no IE) | Todos |
| Auto-reconnect | Manual | Nativo | Manual |
| Datos binarios | ✅ | ❌ | ✅ |
| Scaling | Complejo | Medio | Simple |
| Firewall friendly | ❌ | ✅ | ✅ |

## Estrategia de Selección

### Usar WebSocket cuando:
- Necesitas comunicación bidireccional
- Baja latencia es crítica
- Alta frecuencia de mensajes
- Datos binarios (imágenes, archivos)

**Casos de uso:**
- Chat apps
- Gaming
- Colaboración en tiempo real
- Trading platforms
- IoT dashboards

### Usar SSE cuando:
- Solo necesitas servidor → cliente
- Updates de baja a media frecuencia
- Compatibilidad con HTTP es importante
- Auto-reconnection es requerida

**Casos de uso:**
- News feeds
- Stock tickers
- Notifications
- Log streaming
- Progress updates

### Usar Long Polling cuando:
- Fallback para compatibilidad
- Redes muy restrictivas
- Updates muy ocasionales

**Casos de uso:**
- Legacy browser support
- Highly restricted networks
- Simple notification systems

## Protocolo Híbrido (Progresive Enhancement)

```typescript
class RealtimeService {
  private transport: 'websocket' | 'sse' | 'polling';

  connect() {
    if (this.supportsWebSocket()) {
      this.transport = 'websocket';
      this.connectWebSocket();
    } else if (this.supportsSSE()) {
      this.transport = 'sse';
      this.connectSSE();
    } else {
      this.transport = 'polling';
      this.startPolling();
    }
  }

  private supportsWebSocket(): boolean {
    return 'WebSocket' in window;
  }

  private supportsSSE(): boolean {
    return 'EventSource' in window;
  }
}
```

## Referencias

- [RFC 6455 - WebSocket Protocol](https://tools.ietf.org/html/rfc6455)
- [Server-Sent Events - W3C](https://www.w3.org/TR/eventsource/)
- [WebSockets vs SSE - Ably Blog](https://ably.com/blog/websockets-vs-sse)
