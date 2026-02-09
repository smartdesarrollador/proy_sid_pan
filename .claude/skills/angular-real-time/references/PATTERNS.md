# Real-Time Patterns y Best Practices

## 1. Reconnection Strategies

### Exponential Backoff

Incrementar progresivamente el delay entre reintentos.

```typescript
class ExponentialBackoffStrategy {
  private baseDelay = 1000; // 1 segundo
  private maxDelay = 30000; // 30 segundos
  private factor = 2;
  private attempts = 0;

  getDelay(): number {
    const delay = Math.min(
      this.baseDelay * Math.pow(this.factor, this.attempts),
      this.maxDelay
    );
    this.attempts++;
    return delay;
  }

  reset(): void {
    this.attempts = 0;
  }
}

// Uso
const backoff = new ExponentialBackoffStrategy();

function reconnect() {
  const delay = backoff.getDelay();
  console.log(`Reconnecting in ${delay}ms (attempt ${backoff.attempts})`);

  setTimeout(() => {
    try {
      connect();
      backoff.reset();
    } catch (error) {
      reconnect();
    }
  }, delay);
}
```

### Jittered Backoff

Añadir aleatoriedad para evitar "thundering herd".

```typescript
class JitteredBackoffStrategy {
  private baseDelay = 1000;
  private maxDelay = 30000;
  private factor = 2;
  private attempts = 0;

  getDelay(): number {
    const exponentialDelay = this.baseDelay * Math.pow(this.factor, this.attempts);
    const cappedDelay = Math.min(exponentialDelay, this.maxDelay);

    // Añadir jitter (±25%)
    const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1);
    const delay = Math.max(0, cappedDelay + jitter);

    this.attempts++;
    return delay;
  }

  reset(): void {
    this.attempts = 0;
  }
}
```

### Linear Backoff

Incremento lineal, más predecible.

```typescript
class LinearBackoffStrategy {
  private increment = 1000;
  private maxDelay = 30000;
  private attempts = 0;

  getDelay(): number {
    const delay = Math.min(
      this.increment * this.attempts,
      this.maxDelay
    );
    this.attempts++;
    return delay;
  }

  reset(): void {
    this.attempts = 0;
  }
}
```

---

## 2. Message Queue Patterns

### Offline Queue

Guardar mensajes cuando está offline y enviarlos al reconectar.

```typescript
interface QueuedMessage {
  payload: any;
  timestamp: Date;
  retries: number;
  maxRetries: number;
}

class MessageQueue {
  private queue: QueuedMessage[] = [];
  private maxSize = 100;

  enqueue(payload: any, maxRetries: number = 3): void {
    if (this.queue.length >= this.maxSize) {
      // Remover el más antiguo
      this.queue.shift();
    }

    this.queue.push({
      payload,
      timestamp: new Date(),
      retries: 0,
      maxRetries
    });
  }

  dequeue(): QueuedMessage | undefined {
    return this.queue.shift();
  }

  peek(): QueuedMessage | undefined {
    return this.queue[0];
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  size(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
  }

  // Flush toda la cola
  flush(sendFn: (payload: any) => Promise<void>): Promise<void> {
    const promises = this.queue.map(async (msg) => {
      try {
        await sendFn(msg.payload);
      } catch (error) {
        msg.retries++;
        if (msg.retries < msg.maxRetries) {
          // Volver a encolar
          this.enqueue(msg.payload, msg.maxRetries);
        } else {
          console.error('Max retries reached for message:', msg);
        }
      }
    });

    this.clear();
    return Promise.all(promises).then(() => {});
  }
}
```

### Priority Queue

Mensajes con prioridad diferente.

```typescript
enum MessagePriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  URGENT = 3
}

interface PriorityMessage {
  payload: any;
  priority: MessagePriority;
  timestamp: Date;
}

class PriorityMessageQueue {
  private queues: Map<MessagePriority, PriorityMessage[]> = new Map([
    [MessagePriority.URGENT, []],
    [MessagePriority.HIGH, []],
    [MessagePriority.NORMAL, []],
    [MessagePriority.LOW, []]
  ]);

  enqueue(payload: any, priority: MessagePriority = MessagePriority.NORMAL): void {
    const queue = this.queues.get(priority)!;
    queue.push({
      payload,
      priority,
      timestamp: new Date()
    });
  }

  dequeue(): PriorityMessage | undefined {
    // Dequeue en orden de prioridad
    for (const priority of [MessagePriority.URGENT, MessagePriority.HIGH, MessagePriority.NORMAL, MessagePriority.LOW]) {
      const queue = this.queues.get(priority)!;
      if (queue.length > 0) {
        return queue.shift();
      }
    }
    return undefined;
  }

  isEmpty(): boolean {
    return Array.from(this.queues.values()).every(q => q.length === 0);
  }
}
```

---

## 3. Heartbeat/Keep-Alive Patterns

### Simple Ping-Pong

```typescript
class HeartbeatManager {
  private interval: any;
  private timeout: any;
  private pingInterval = 30000; // 30s
  private pongTimeout = 5000; // 5s
  private onTimeout?: () => void;

  constructor(
    private sendPing: () => void,
    onTimeout?: () => void
  ) {
    this.onTimeout = onTimeout;
  }

  start(): void {
    this.interval = setInterval(() => {
      this.sendPing();
      this.startPongTimer();
    }, this.pingInterval);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.stopPongTimer();
  }

  receivedPong(): void {
    this.stopPongTimer();
  }

  private startPongTimer(): void {
    this.timeout = setTimeout(() => {
      console.warn('Pong timeout - connection may be dead');
      if (this.onTimeout) {
        this.onTimeout();
      }
    }, this.pongTimeout);
  }

  private stopPongTimer(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }
}

// Uso
const heartbeat = new HeartbeatManager(
  () => ws.send(JSON.stringify({ type: 'ping' })),
  () => {
    console.log('Connection dead, reconnecting...');
    reconnect();
  }
);

heartbeat.start();

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'pong') {
    heartbeat.receivedPong();
  }
};
```

### Adaptive Heartbeat

Ajustar frecuencia según actividad.

```typescript
class AdaptiveHeartbeat {
  private interval: any;
  private minInterval = 10000; // 10s cuando hay actividad
  private maxInterval = 60000; // 60s cuando está idle
  private currentInterval = this.maxInterval;
  private lastActivity = Date.now();
  private activityThreshold = 30000; // 30s

  constructor(private sendPing: () => void) {}

  start(): void {
    this.scheduleNext();
  }

  stop(): void {
    if (this.interval) {
      clearTimeout(this.interval);
      this.interval = null;
    }
  }

  markActivity(): void {
    this.lastActivity = Date.now();
    this.adjustInterval();
  }

  private scheduleNext(): void {
    this.interval = setTimeout(() => {
      this.sendPing();
      this.adjustInterval();
      this.scheduleNext();
    }, this.currentInterval);
  }

  private adjustInterval(): void {
    const timeSinceActivity = Date.now() - this.lastActivity;

    if (timeSinceActivity < this.activityThreshold) {
      // Hay actividad reciente, usar intervalo corto
      this.currentInterval = this.minInterval;
    } else {
      // Idle, usar intervalo largo
      this.currentInterval = this.maxInterval;
    }
  }
}
```

---

## 4. Event Debouncing

Para typing indicators, scroll, etc.

```typescript
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: any;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Uso con typing indicator
const sendTypingIndicator = debounce((isTyping: boolean) => {
  ws.send(JSON.stringify({
    type: 'typing',
    data: { isTyping }
  }));
}, 500);

inputElement.addEventListener('input', () => {
  sendTypingIndicator(true);

  // Auto-clear después de 3 segundos sin escribir
  setTimeout(() => sendTypingIndicator(false), 3000);
});
```

---

## 5. Optimistic Updates

Actualizar UI antes de recibir confirmación del servidor.

```typescript
class OptimisticUpdateManager<T> {
  private pendingUpdates = new Map<string, T>();

  // Aplicar update optimísticamente
  apply(id: string, data: T): void {
    this.pendingUpdates.set(id, data);
  }

  // Confirmar que el servidor aceptó
  confirm(id: string): void {
    this.pendingUpdates.delete(id);
  }

  // Revertir si el servidor rechazó
  revert(id: string): T | undefined {
    const data = this.pendingUpdates.get(id);
    this.pendingUpdates.delete(id);
    return data;
  }

  // Limpiar updates antiguos
  cleanup(maxAge: number = 60000): void {
    const now = Date.now();
    // Implementar timestamp tracking si es necesario
  }
}

// Uso
const optimisticManager = new OptimisticUpdateManager<Message>();

// Enviar mensaje
function sendMessage(message: Message) {
  const tempId = generateTempId();

  // Actualizar UI inmediatamente
  addMessageToUI({ ...message, id: tempId, status: 'sending' });
  optimisticManager.apply(tempId, message);

  // Enviar al servidor
  ws.send(JSON.stringify(message));
}

// Al recibir confirmación
ws.onmessage = (event) => {
  const response = JSON.parse(event.data);

  if (response.type === 'message_ack') {
    optimisticManager.confirm(response.tempId);
    updateMessageInUI(response.tempId, { id: response.realId, status: 'sent' });
  }

  if (response.type === 'message_error') {
    const original = optimisticManager.revert(response.tempId);
    updateMessageInUI(response.tempId, { status: 'error' });
  }
};
```

---

## 6. Connection Pooling

Reutilizar conexiones para múltiples subscripciones.

```typescript
class WebSocketPool {
  private connections = new Map<string, WebSocket>();
  private subscriptions = new Map<string, Set<(data: any) => void>>();

  getConnection(url: string): WebSocket {
    if (!this.connections.has(url)) {
      const ws = new WebSocket(url);

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const channel = data.channel;

        const callbacks = this.subscriptions.get(channel);
        if (callbacks) {
          callbacks.forEach(cb => cb(data));
        }
      };

      this.connections.set(url, ws);
    }

    return this.connections.get(url)!;
  }

  subscribe(channel: string, callback: (data: any) => void): () => void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }

    this.subscriptions.get(channel)!.add(callback);

    // Retornar función de unsubscribe
    return () => {
      const callbacks = this.subscriptions.get(channel);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscriptions.delete(channel);
        }
      }
    };
  }

  close(url: string): void {
    const ws = this.connections.get(url);
    if (ws) {
      ws.close();
      this.connections.delete(url);
    }
  }
}
```

---

## 7. Circuit Breaker Pattern

Prevenir reconexiones infinitas cuando el servidor está down.

```typescript
enum CircuitState {
  CLOSED = 'closed',     // Normal operation
  OPEN = 'open',         // Failing, don't try
  HALF_OPEN = 'half_open' // Testing if recovered
}

class CircuitBreaker {
  private state = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000,
    private halfOpenAttempts: number = 3
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.halfOpenAttempts) {
        this.state = CircuitState.CLOSED;
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      this.state = CircuitState.OPEN;
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}

// Uso
const breaker = new CircuitBreaker(5, 60000);

async function connectWithBreaker() {
  try {
    await breaker.execute(async () => {
      return connectWebSocket();
    });
  } catch (error) {
    if (error.message === 'Circuit breaker is OPEN') {
      console.log('Too many failures, waiting before retry...');
    }
  }
}
```

---

## Referencias

- [Exponential Backoff - AWS](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- [Circuit Breaker Pattern - Microsoft](https://docs.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker)
- [WebSocket Best Practices - MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers)
