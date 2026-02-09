---
name: angular-real-time
description: >
  Sistema completo de comunicación real-time para Angular standalone con WebSockets, SSE y notificaciones.
  Usar cuando se necesite implementar WebSocket service, Server-Sent Events (SSE), real-time notifications,
  connection status monitoring, auto-reconnection con exponential backoff, heartbeat/ping-pong keep-alive,
  message queue durante desconexión, typing indicators, online/offline user status, real-time data sync,
  toast notifications, connection indicator UI, retry logic resiliente, event emitter system, o cualquier
  funcionalidad relacionada con comunicación bidireccional en tiempo real. Incluye WebSocketService genérico,
  SSEService standalone, NotificationService tipado, ConnectionStatusService con signals, ReconnectionStrategy
  configurable, message interfaces (MessageType, Payload<T>), RxJS patterns, connection status component con
  Tailwind, error handling robusto, local queue offline, auth token integration, ejemplos (chat, notifications,
  live updates), testing con mock WebSocket, y best practices para proyectos Angular 19+ production-ready.
---

# Angular Real-Time - Sistema Completo de Comunicación en Tiempo Real

Sistema enterprise-ready de comunicación real-time para Angular standalone con WebSockets, SSE, notificaciones y auto-reconnection.

## Prerequisitos

```bash
# Opcional para testing
npm install --save-dev jest-websocket-mock

# Backend compatible
# Node.js: ws, socket.io
# Backend API: cualquier implementación WebSocket/SSE
```

## Arquitectura del Sistema

```
real-time/
├── services/
│   ├── websocket.service.ts           # WebSocket genérico
│   ├── sse.service.ts                 # Server-Sent Events
│   ├── notification.service.ts        # Notificaciones real-time
│   ├── connection-status.service.ts   # Estado de conexión
│   └── reconnection.service.ts        # Lógica de reconexión
├── components/
│   ├── connection-status/
│   │   ├── connection-status.component.ts
│   │   └── connection-status.component.html
│   └── toast-notification/
│       ├── toast-notification.component.ts
│       └── toast-notification.component.html
├── models/
│   ├── message.models.ts              # Interfaces de mensajes
│   ├── connection.models.ts           # Tipos de conexión
│   └── notification.models.ts         # Modelos de notificación
├── strategies/
│   └── reconnection.strategy.ts       # Estrategias de reconexión
└── utils/
    ├── message-queue.util.ts          # Cola de mensajes offline
    └── heartbeat.util.ts              # Keep-alive manager
```

## 1. Interfaces y Modelos Tipados

### message.models.ts

```typescript
// src/app/core/models/message.models.ts

/**
 * Tipos de mensajes soportados.
 */
export enum MessageType {
  TEXT = 'text',
  NOTIFICATION = 'notification',
  TYPING = 'typing',
  USER_STATUS = 'user_status',
  HEARTBEAT = 'heartbeat',
  SYNC = 'sync',
  ERROR = 'error',
  SYSTEM = 'system'
}

/**
 * Payload genérico tipado para mensajes.
 */
export interface Payload<T = any> {
  type: MessageType;
  data: T;
  timestamp: string;
  id?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

/**
 * Mensaje de texto (chat).
 */
export interface TextMessage {
  message: string;
  userId: string;
  userName: string;
  avatar?: string;
}

/**
 * Mensaje de typing indicator.
 */
export interface TypingMessage {
  userId: string;
  userName: string;
  isTyping: boolean;
}

/**
 * Estado de usuario online/offline.
 */
export interface UserStatusMessage {
  userId: string;
  userName: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
}

/**
 * Mensaje de notificación.
 */
export interface NotificationMessage {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  icon?: string;
  actionUrl?: string;
}

/**
 * Mensaje de sincronización de datos.
 */
export interface SyncMessage<T = any> {
  entity: string;
  action: 'create' | 'update' | 'delete';
  data: T;
}

/**
 * Mensaje de error.
 */
export interface ErrorMessage {
  code: string;
  message: string;
  details?: any;
}

/**
 * Heartbeat/ping message.
 */
export interface HeartbeatMessage {
  ping: boolean;
  timestamp: string;
}
```

### connection.models.ts

```typescript
// src/app/core/models/connection.models.ts

/**
 * Estados de conexión posibles.
 */
export enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTING = 'disconnecting',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

/**
 * Configuración de conexión WebSocket.
 */
export interface WebSocketConfig {
  /** URL del WebSocket server */
  url: string;
  /** Protocolos soportados */
  protocols?: string[];
  /** Auto-reconectar en caso de desconexión */
  autoReconnect?: boolean;
  /** Delay inicial de reconexión (ms) */
  reconnectInterval?: number;
  /** Delay máximo de reconexión (ms) */
  maxReconnectInterval?: number;
  /** Factor de backoff exponencial */
  reconnectDecay?: number;
  /** Intentos máximos de reconexión (0 = infinito) */
  maxReconnectAttempts?: number;
  /** Enviar heartbeat para keep-alive */
  heartbeat?: boolean;
  /** Intervalo de heartbeat (ms) */
  heartbeatInterval?: number;
  /** Headers HTTP adicionales */
  headers?: Record<string, string>;
  /** Timeout de conexión (ms) */
  connectionTimeout?: number;
}

/**
 * Configuración de SSE.
 */
export interface SSEConfig {
  /** URL del endpoint SSE */
  url: string;
  /** Auto-reconectar */
  autoReconnect?: boolean;
  /** Delay de reconexión (ms) */
  reconnectInterval?: number;
  /** With credentials (CORS) */
  withCredentials?: boolean;
}

/**
 * Estadísticas de conexión.
 */
export interface ConnectionStats {
  /** Estado actual */
  state: ConnectionState;
  /** Tiempo de conexión activa (ms) */
  uptime: number;
  /** Número de reconexiones */
  reconnectAttempts: number;
  /** Mensajes enviados */
  messagesSent: number;
  /** Mensajes recibidos */
  messagesReceived: number;
  /** Último error */
  lastError?: string;
  /** Latencia promedio (ms) */
  averageLatency?: number;
}

/**
 * Evento de cambio de estado de conexión.
 */
export interface ConnectionEvent {
  /** Estado anterior */
  previousState: ConnectionState;
  /** Estado actual */
  currentState: ConnectionState;
  /** Timestamp del cambio */
  timestamp: Date;
  /** Razón del cambio */
  reason?: string;
}
```

### notification.models.ts

```typescript
// src/app/core/models/notification.models.ts

/**
 * Tipos de notificación.
 */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

/**
 * Notificación real-time.
 */
export interface RealTimeNotification {
  /** ID único */
  id: string;
  /** Tipo de notificación */
  type: NotificationType;
  /** Título */
  title: string;
  /** Mensaje */
  message: string;
  /** Icono (opcional) */
  icon?: string;
  /** Duración en ms (0 = no auto-cerrar) */
  duration?: number;
  /** URL de acción */
  actionUrl?: string;
  /** Label del botón de acción */
  actionLabel?: string;
  /** Timestamp de creación */
  createdAt: Date;
  /** Si fue leída */
  read?: boolean;
}

/**
 * Configuración de notificaciones.
 */
export interface NotificationConfig {
  /** Duración por defecto (ms) */
  defaultDuration?: number;
  /** Posición en pantalla */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  /** Máximo de notificaciones visibles */
  maxNotifications?: number;
  /** Sonido al recibir notificación */
  playSound?: boolean;
  /** URL del sonido */
  soundUrl?: string;
}
```

## 2. WebSocket Service

### websocket.service.ts

```typescript
// src/app/core/services/websocket.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable, Subject, BehaviorSubject, interval, timer } from 'rxjs';
import { filter, map, takeUntil, retry, retryWhen, delay, tap } from 'rxjs/operators';
import {
  WebSocketConfig,
  ConnectionState,
  ConnectionEvent,
  ConnectionStats
} from '../models/connection.models';
import { Payload, MessageType } from '../models/message.models';

/**
 * Servicio genérico de WebSocket con auto-reconnection y heartbeat.
 *
 * @example
 * ```typescript
 * constructor(private ws: WebSocketService) {
 *   this.ws.connect({
 *     url: 'ws://localhost:3000',
 *     autoReconnect: true,
 *     heartbeat: true
 *   });
 *
 *   this.ws.messages$.subscribe(msg => {
 *     console.log('Message:', msg);
 *   });
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: WebSocket | null = null;
  private config: WebSocketConfig | null = null;

  // Subjects para gestión de estado
  private messagesSubject = new Subject<Payload>();
  private stateSubject = new BehaviorSubject<ConnectionState>(ConnectionState.DISCONNECTED);
  private eventsSubject = new Subject<ConnectionEvent>();
  private destroySubject = new Subject<void>();

  // Reconnection state
  private reconnectAttempts = 0;
  private reconnectTimer: any = null;
  private heartbeatTimer: any = null;

  // Stats
  private stats: ConnectionStats = {
    state: ConnectionState.DISCONNECTED,
    uptime: 0,
    reconnectAttempts: 0,
    messagesSent: 0,
    messagesReceived: 0
  };
  private connectionStartTime: number = 0;

  // Message queue for offline messages
  private messageQueue: Payload[] = [];

  // Public observables
  public messages$ = this.messagesSubject.asObservable();
  public state$ = this.stateSubject.asObservable();
  public events$ = this.eventsSubject.asObservable();
  public stats$ = new BehaviorSubject<ConnectionStats>(this.stats);

  /**
   * Conecta al WebSocket server.
   *
   * @param config - Configuración de conexión
   */
  connect(config: WebSocketConfig): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.warn('WebSocket already connected');
      return;
    }

    this.config = {
      autoReconnect: true,
      reconnectInterval: 1000,
      maxReconnectInterval: 30000,
      reconnectDecay: 1.5,
      maxReconnectAttempts: 0, // 0 = infinite
      heartbeat: true,
      heartbeatInterval: 30000,
      connectionTimeout: 10000,
      ...config
    };

    this.createConnection();
  }

  /**
   * Desconecta del WebSocket server.
   */
  disconnect(): void {
    this.updateState(ConnectionState.DISCONNECTING);

    this.clearTimers();

    if (this.socket) {
      this.socket.close(1000, 'Client disconnect');
      this.socket = null;
    }

    this.updateState(ConnectionState.DISCONNECTED);
  }

  /**
   * Envía un mensaje al servidor.
   *
   * @param payload - Payload del mensaje
   */
  send<T = any>(payload: Payload<T>): void {
    if (!payload.timestamp) {
      payload.timestamp = new Date().toISOString();
    }

    if (!payload.id) {
      payload.id = this.generateMessageId();
    }

    // Si está conectado, enviar inmediatamente
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(payload));
        this.stats.messagesSent++;
        this.updateStats();
      } catch (error) {
        console.error('Error sending message:', error);
        this.queueMessage(payload);
      }
    } else {
      // Si está desconectado, agregar a la cola
      this.queueMessage(payload);
    }
  }

  /**
   * Filtra mensajes por tipo.
   */
  onMessage<T = any>(type: MessageType): Observable<Payload<T>> {
    return this.messages$.pipe(
      filter(msg => msg.type === type),
      map(msg => msg as Payload<T>)
    );
  }

  /**
   * Obtiene el estado actual de conexión.
   */
  getState(): ConnectionState {
    return this.stateSubject.value;
  }

  /**
   * Verifica si está conectado.
   */
  isConnected(): boolean {
    return this.stateSubject.value === ConnectionState.CONNECTED;
  }

  /**
   * Obtiene las estadísticas de conexión.
   */
  getStats(): ConnectionStats {
    return { ...this.stats };
  }

  /**
   * Limpia recursos al destruir el servicio.
   */
  ngOnDestroy(): void {
    this.disconnect();
    this.destroySubject.next();
    this.destroySubject.complete();
  }

  /**
   * Crea la conexión WebSocket.
   */
  private createConnection(): void {
    if (!this.config) return;

    this.updateState(ConnectionState.CONNECTING);

    try {
      // Crear WebSocket con timeout
      const timeoutTimer = setTimeout(() => {
        if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
          this.socket.close();
          this.handleConnectionError(new Error('Connection timeout'));
        }
      }, this.config.connectionTimeout);

      this.socket = new WebSocket(this.config.url, this.config.protocols);

      // Event: open
      this.socket.addEventListener('open', (event) => {
        clearTimeout(timeoutTimer);
        this.handleOpen(event);
      });

      // Event: message
      this.socket.addEventListener('message', (event) => {
        this.handleMessage(event);
      });

      // Event: close
      this.socket.addEventListener('close', (event) => {
        clearTimeout(timeoutTimer);
        this.handleClose(event);
      });

      // Event: error
      this.socket.addEventListener('error', (event) => {
        clearTimeout(timeoutTimer);
        this.handleError(event);
      });

    } catch (error) {
      this.handleConnectionError(error);
    }
  }

  /**
   * Maneja el evento de conexión exitosa.
   */
  private handleOpen(event: Event): void {
    console.log('WebSocket connected');

    this.updateState(ConnectionState.CONNECTED);
    this.reconnectAttempts = 0;
    this.connectionStartTime = Date.now();

    // Enviar mensajes en cola
    this.flushMessageQueue();

    // Iniciar heartbeat
    if (this.config?.heartbeat) {
      this.startHeartbeat();
    }
  }

  /**
   * Maneja mensajes recibidos.
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const payload: Payload = JSON.parse(event.data);

      // Actualizar stats
      this.stats.messagesReceived++;
      this.updateStats();

      // Ignorar heartbeat responses
      if (payload.type === MessageType.HEARTBEAT) {
        return;
      }

      // Emitir mensaje
      this.messagesSubject.next(payload);

    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }

  /**
   * Maneja el cierre de conexión.
   */
  private handleClose(event: CloseEvent): void {
    console.log('WebSocket closed:', event.code, event.reason);

    this.clearTimers();

    const wasClean = event.wasClean;
    const previousState = this.stateSubject.value;

    this.updateState(ConnectionState.DISCONNECTED);

    // Auto-reconnect si está habilitado y no fue cierre limpio
    if (this.config?.autoReconnect && !wasClean && previousState !== ConnectionState.DISCONNECTING) {
      this.scheduleReconnect();
    }
  }

  /**
   * Maneja errores de conexión.
   */
  private handleError(event: Event): void {
    console.error('WebSocket error:', event);

    this.updateState(ConnectionState.ERROR);
    this.stats.lastError = 'WebSocket error';
    this.updateStats();
  }

  /**
   * Maneja error en la creación de conexión.
   */
  private handleConnectionError(error: any): void {
    console.error('Connection error:', error);

    this.updateState(ConnectionState.ERROR);
    this.stats.lastError = error.message || 'Unknown error';
    this.updateStats();

    if (this.config?.autoReconnect) {
      this.scheduleReconnect();
    }
  }

  /**
   * Programa reconexión con exponential backoff.
   */
  private scheduleReconnect(): void {
    if (!this.config) return;

    const maxAttempts = this.config.maxReconnectAttempts || 0;
    if (maxAttempts > 0 && this.reconnectAttempts >= maxAttempts) {
      console.error('Max reconnection attempts reached');
      this.updateState(ConnectionState.ERROR);
      return;
    }

    this.reconnectAttempts++;
    this.stats.reconnectAttempts = this.reconnectAttempts;
    this.updateStats();

    // Calcular delay con exponential backoff
    const baseInterval = this.config.reconnectInterval || 1000;
    const decay = this.config.reconnectDecay || 1.5;
    const maxInterval = this.config.maxReconnectInterval || 30000;

    const interval = Math.min(
      baseInterval * Math.pow(decay, this.reconnectAttempts - 1),
      maxInterval
    );

    console.log(`Reconnecting in ${interval}ms (attempt ${this.reconnectAttempts})`);

    this.updateState(ConnectionState.RECONNECTING);

    this.reconnectTimer = setTimeout(() => {
      this.createConnection();
    }, interval);
  }

  /**
   * Inicia heartbeat/ping-pong para keep-alive.
   */
  private startHeartbeat(): void {
    if (!this.config?.heartbeat) return;

    const interval = this.config.heartbeatInterval || 30000;

    this.heartbeatTimer = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        const heartbeat: Payload<any> = {
          type: MessageType.HEARTBEAT,
          data: { ping: true },
          timestamp: new Date().toISOString()
        };

        this.send(heartbeat);
      }
    }, interval);
  }

  /**
   * Agrega mensaje a la cola.
   */
  private queueMessage(payload: Payload): void {
    this.messageQueue.push(payload);
    console.log(`Message queued (${this.messageQueue.length} in queue)`);
  }

  /**
   * Envía todos los mensajes en cola.
   */
  private flushMessageQueue(): void {
    if (this.messageQueue.length === 0) return;

    console.log(`Flushing ${this.messageQueue.length} queued messages`);

    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift();
      if (msg) {
        this.send(msg);
      }
    }
  }

  /**
   * Actualiza el estado de conexión.
   */
  private updateState(newState: ConnectionState): void {
    const previousState = this.stateSubject.value;

    if (previousState === newState) return;

    this.stateSubject.next(newState);
    this.stats.state = newState;

    const event: ConnectionEvent = {
      previousState,
      currentState: newState,
      timestamp: new Date()
    };

    this.eventsSubject.next(event);
  }

  /**
   * Actualiza las estadísticas.
   */
  private updateStats(): void {
    if (this.connectionStartTime > 0 && this.isConnected()) {
      this.stats.uptime = Date.now() - this.connectionStartTime;
    }

    this.stats$.next({ ...this.stats });
  }

  /**
   * Limpia timers activos.
   */
  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Genera ID único para mensajes.
   */
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

## 3. Server-Sent Events (SSE) Service

### sse.service.ts

```typescript
// src/app/core/services/sse.service.ts
import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { SSEConfig, ConnectionState } from '../models/connection.models';
import { Payload } from '../models/message.models';

/**
 * Servicio para Server-Sent Events (SSE).
 * Para comunicación unidireccional servidor -> cliente.
 *
 * @example
 * ```typescript
 * constructor(private sse: SSEService) {
 *   this.sse.connect({
 *     url: 'http://localhost:3000/events'
 *   });
 *
 *   this.sse.messages$.subscribe(msg => {
 *     console.log('Event:', msg);
 *   });
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class SSEService {
  private eventSource: EventSource | null = null;
  private config: SSEConfig | null = null;

  // Subjects
  private messagesSubject = new Subject<Payload>();
  private stateSubject = new BehaviorSubject<ConnectionState>(ConnectionState.DISCONNECTED);
  private reconnectAttempts = 0;
  private reconnectTimer: any = null;

  // Public observables
  public messages$ = this.messagesSubject.asObservable();
  public state$ = this.stateSubject.asObservable();

  /**
   * Conecta al servidor SSE.
   */
  connect(config: SSEConfig): void {
    if (this.eventSource) {
      console.warn('SSE already connected');
      return;
    }

    this.config = {
      autoReconnect: true,
      reconnectInterval: 3000,
      withCredentials: false,
      ...config
    };

    this.createConnection();
  }

  /**
   * Desconecta del servidor SSE.
   */
  disconnect(): void {
    this.updateState(ConnectionState.DISCONNECTING);

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.updateState(ConnectionState.DISCONNECTED);
  }

  /**
   * Escucha eventos específicos.
   */
  onEvent<T = any>(eventName: string): Observable<T> {
    return new Observable(observer => {
      if (!this.eventSource) {
        observer.error(new Error('Not connected'));
        return;
      }

      const handler = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          observer.next(data);
        } catch (error) {
          observer.error(error);
        }
      };

      this.eventSource.addEventListener(eventName, handler);

      return () => {
        if (this.eventSource) {
          this.eventSource.removeEventListener(eventName, handler);
        }
      };
    });
  }

  /**
   * Obtiene el estado actual.
   */
  getState(): ConnectionState {
    return this.stateSubject.value;
  }

  /**
   * Verifica si está conectado.
   */
  isConnected(): boolean {
    return this.stateSubject.value === ConnectionState.CONNECTED;
  }

  /**
   * Limpia recursos.
   */
  ngOnDestroy(): void {
    this.disconnect();
  }

  /**
   * Crea la conexión SSE.
   */
  private createConnection(): void {
    if (!this.config) return;

    this.updateState(ConnectionState.CONNECTING);

    try {
      this.eventSource = new EventSource(this.config.url, {
        withCredentials: this.config.withCredentials
      });

      // Event: open
      this.eventSource.addEventListener('open', (event) => {
        this.handleOpen(event);
      });

      // Event: message (default)
      this.eventSource.addEventListener('message', (event) => {
        this.handleMessage(event);
      });

      // Event: error
      this.eventSource.addEventListener('error', (event) => {
        this.handleError(event);
      });

    } catch (error) {
      this.handleConnectionError(error);
    }
  }

  /**
   * Maneja conexión exitosa.
   */
  private handleOpen(event: Event): void {
    console.log('SSE connected');
    this.updateState(ConnectionState.CONNECTED);
    this.reconnectAttempts = 0;
  }

  /**
   * Maneja mensajes recibidos.
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const payload: Payload = JSON.parse(event.data);
      this.messagesSubject.next(payload);
    } catch (error) {
      console.error('Error parsing SSE message:', error);
    }
  }

  /**
   * Maneja errores.
   */
  private handleError(event: Event): void {
    console.error('SSE error:', event);

    if (this.eventSource?.readyState === EventSource.CLOSED) {
      this.updateState(ConnectionState.DISCONNECTED);

      if (this.config?.autoReconnect) {
        this.scheduleReconnect();
      }
    } else {
      this.updateState(ConnectionState.ERROR);
    }
  }

  /**
   * Maneja error de conexión.
   */
  private handleConnectionError(error: any): void {
    console.error('SSE connection error:', error);
    this.updateState(ConnectionState.ERROR);

    if (this.config?.autoReconnect) {
      this.scheduleReconnect();
    }
  }

  /**
   * Programa reconexión.
   */
  private scheduleReconnect(): void {
    if (!this.config) return;

    this.reconnectAttempts++;
    this.updateState(ConnectionState.RECONNECTING);

    const interval = this.config.reconnectInterval || 3000;

    console.log(`SSE reconnecting in ${interval}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
      this.createConnection();
    }, interval);
  }

  /**
   * Actualiza estado.
   */
  private updateState(state: ConnectionState): void {
    if (this.stateSubject.value !== state) {
      this.stateSubject.next(state);
    }
  }
}
```

## 4. Notification Service

### notification.service.ts

```typescript
// src/app/core/services/notification.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  RealTimeNotification,
  NotificationType,
  NotificationConfig
} from '../models/notification.models';

/**
 * Servicio de notificaciones real-time con toast notifications.
 *
 * @example
 * ```typescript
 * constructor(private notificationService: NotificationService) {
 *   this.notificationService.show({
 *     type: 'success',
 *     title: 'Éxito',
 *     message: 'Operación completada'
 *   });
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  // Signals para notificaciones
  private notificationsSignal = signal<RealTimeNotification[]>([]);

  // Computed signals
  public notifications = this.notificationsSignal.asReadonly();
  public unreadCount = computed(() =>
    this.notificationsSignal().filter(n => !n.read).length
  );

  // BehaviorSubject para observable tradicional
  private notificationsSubject = new BehaviorSubject<RealTimeNotification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  // Configuración
  private config: NotificationConfig = {
    defaultDuration: 5000,
    position: 'top-right',
    maxNotifications: 5,
    playSound: false
  };

  // Audio para notificaciones
  private audio: HTMLAudioElement | null = null;

  constructor() {
    if (this.config.playSound && this.config.soundUrl) {
      this.audio = new Audio(this.config.soundUrl);
    }
  }

  /**
   * Configura el servicio de notificaciones.
   */
  configure(config: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.config.playSound && this.config.soundUrl) {
      this.audio = new Audio(this.config.soundUrl);
    }
  }

  /**
   * Muestra una notificación.
   */
  show(notification: Omit<RealTimeNotification, 'id' | 'createdAt'>): string {
    const newNotification: RealTimeNotification = {
      ...notification,
      id: this.generateId(),
      createdAt: new Date(),
      duration: notification.duration ?? this.config.defaultDuration,
      read: false
    };

    // Agregar notificación
    const current = this.notificationsSignal();
    const updated = [newNotification, ...current];

    // Limitar número de notificaciones
    const limited = updated.slice(0, this.config.maxNotifications);

    this.notificationsSignal.set(limited);
    this.notificationsSubject.next(limited);

    // Reproducir sonido
    if (this.config.playSound && this.audio) {
      this.audio.play().catch(err => console.error('Error playing sound:', err));
    }

    // Auto-cerrar si tiene duración
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        this.remove(newNotification.id);
      }, newNotification.duration);
    }

    return newNotification.id;
  }

  /**
   * Muestra notificación de info.
   */
  info(title: string, message: string, duration?: number): string {
    return this.show({ type: 'info', title, message, duration });
  }

  /**
   * Muestra notificación de éxito.
   */
  success(title: string, message: string, duration?: number): string {
    return this.show({ type: 'success', title, message, duration });
  }

  /**
   * Muestra notificación de advertencia.
   */
  warning(title: string, message: string, duration?: number): string {
    return this.show({ type: 'warning', title, message, duration });
  }

  /**
   * Muestra notificación de error.
   */
  error(title: string, message: string, duration?: number): string {
    return this.show({ type: 'error', title, message, duration, duration: 0 }); // Errors don't auto-close
  }

  /**
   * Remueve una notificación.
   */
  remove(id: string): void {
    const updated = this.notificationsSignal().filter(n => n.id !== id);
    this.notificationsSignal.set(updated);
    this.notificationsSubject.next(updated);
  }

  /**
   * Marca como leída.
   */
  markAsRead(id: string): void {
    const updated = this.notificationsSignal().map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    this.notificationsSignal.set(updated);
    this.notificationsSubject.next(updated);
  }

  /**
   * Marca todas como leídas.
   */
  markAllAsRead(): void {
    const updated = this.notificationsSignal().map(n => ({ ...n, read: true }));
    this.notificationsSignal.set(updated);
    this.notificationsSubject.next(updated);
  }

  /**
   * Limpia todas las notificaciones.
   */
  clear(): void {
    this.notificationsSignal.set([]);
    this.notificationsSubject.next([]);
  }

  /**
   * Obtiene la configuración actual.
   */
  getConfig(): NotificationConfig {
    return { ...this.config };
  }

  /**
   * Genera ID único.
   */
  private generateId(): string {
    return `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

## 5. Connection Status Service

### connection-status.service.ts

```typescript
// src/app/core/services/connection-status.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { ConnectionState, ConnectionStats } from '../models/connection.models';
import { WebSocketService } from './websocket.service';
import { Observable, fromEvent, merge, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

/**
 * Servicio para monitorear el estado de conexión.
 * Monitorea tanto WebSocket como conexión a internet.
 *
 * @example
 * ```typescript
 * constructor(private connectionStatus: ConnectionStatusService) {
 *   // Signals
 *   console.log(this.connectionStatus.isOnline());
 *   console.log(this.connectionStatus.wsState());
 *
 *   // Observable
 *   this.connectionStatus.online$.subscribe(online => {
 *     console.log('Online:', online);
 *   });
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ConnectionStatusService {
  // Signals para estado
  private wsStateSignal = signal<ConnectionState>(ConnectionState.DISCONNECTED);
  private wsStatsSignal = signal<ConnectionStats | null>(null);
  private onlineSignal = signal<boolean>(navigator.onLine);

  // Computed signals
  public wsState = this.wsStateSignal.asReadonly();
  public wsStats = this.wsStatsSignal.asReadonly();
  public isOnline = this.onlineSignal.asReadonly();

  public isConnected = computed(() =>
    this.wsStateSignal() === ConnectionState.CONNECTED && this.onlineSignal()
  );

  public statusMessage = computed(() => {
    if (!this.onlineSignal()) {
      return 'Sin conexión a internet';
    }

    const state = this.wsStateSignal();
    switch (state) {
      case ConnectionState.CONNECTED:
        return 'Conectado';
      case ConnectionState.CONNECTING:
        return 'Conectando...';
      case ConnectionState.RECONNECTING:
        return 'Reconectando...';
      case ConnectionState.DISCONNECTED:
        return 'Desconectado';
      case ConnectionState.ERROR:
        return 'Error de conexión';
      default:
        return 'Estado desconocido';
    }
  });

  public statusColor = computed(() => {
    if (!this.onlineSignal()) return 'red';

    const state = this.wsStateSignal();
    switch (state) {
      case ConnectionState.CONNECTED:
        return 'green';
      case ConnectionState.CONNECTING:
      case ConnectionState.RECONNECTING:
        return 'yellow';
      case ConnectionState.DISCONNECTED:
      case ConnectionState.ERROR:
        return 'red';
      default:
        return 'gray';
    }
  });

  // Observable para compatibilidad
  public online$: Observable<boolean>;

  constructor(private wsService: WebSocketService) {
    // Monitorear conexión a internet
    this.online$ = merge(
      of(navigator.onLine),
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    ).pipe(startWith(navigator.onLine));

    this.online$.subscribe(online => {
      this.onlineSignal.set(online);
    });

    // Monitorear estado WebSocket
    this.wsService.state$.subscribe(state => {
      this.wsStateSignal.set(state);
    });

    this.wsService.stats$.subscribe(stats => {
      this.wsStatsSignal.set(stats);
    });
  }

  /**
   * Fuerza verificación de conexión.
   */
  checkConnection(): void {
    const online = navigator.onLine;
    this.onlineSignal.set(online);
  }

  /**
   * Obtiene estadísticas detalladas.
   */
  getDetailedStats(): ConnectionStats | null {
    return this.wsStatsSignal();
  }
}
```

## 6. Connection Status Component

### connection-status.component.ts

```typescript
// src/app/shared/components/connection-status/connection-status.component.ts
import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConnectionStatusService } from '../../../core/services/connection-status.service';
import { ConnectionState } from '../../../core/models/connection.models';

/**
 * Componente visual para mostrar estado de conexión.
 *
 * @example
 * ```html
 * <app-connection-status
 *   [position]="'top-right'"
 *   [showDetails]="true">
 * </app-connection-status>
 * ```
 */
@Component({
  selector: 'app-connection-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="connection-status fixed z-50 transition-all duration-300"
      [ngClass]="positionClasses"
      *ngIf="!isConnected() || alwaysShow">

      <!-- Compact mode -->
      <div
        *ngIf="!showDetails"
        class="flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm"
        [ngClass]="backgroundClasses">

        <!-- Status dot -->
        <div
          class="w-3 h-3 rounded-full animate-pulse"
          [ngClass]="dotClasses">
        </div>

        <!-- Status text -->
        <span class="text-sm font-medium text-white">
          {{ statusMessage() }}
        </span>
      </div>

      <!-- Detailed mode -->
      <div
        *ngIf="showDetails"
        class="px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm min-w-[250px]"
        [ngClass]="backgroundClasses">

        <!-- Header -->
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <div
              class="w-3 h-3 rounded-full animate-pulse"
              [ngClass]="dotClasses">
            </div>
            <span class="text-sm font-semibold text-white">
              {{ statusMessage() }}
            </span>
          </div>
        </div>

        <!-- Stats -->
        <div *ngIf="wsStats()" class="space-y-1 text-xs text-white/80">
          <div class="flex justify-between">
            <span>Mensajes enviados:</span>
            <span class="font-medium">{{ wsStats()?.messagesSent }}</span>
          </div>
          <div class="flex justify-between">
            <span>Mensajes recibidos:</span>
            <span class="font-medium">{{ wsStats()?.messagesReceived }}</span>
          </div>
          <div class="flex justify-between" *ngIf="wsStats()?.reconnectAttempts && wsStats()!.reconnectAttempts > 0">
            <span>Reconexiones:</span>
            <span class="font-medium">{{ wsStats()?.reconnectAttempts }}</span>
          </div>
          <div class="flex justify-between" *ngIf="wsStats()?.uptime">
            <span>Tiempo activo:</span>
            <span class="font-medium">{{ formatUptime(wsStats()!.uptime) }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .connection-status {
      pointer-events: auto;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
  `]
})
export class ConnectionStatusComponent {
  /** Posición del indicador */
  @Input() position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' = 'top-right';

  /** Mostrar detalles */
  @Input() showDetails = false;

  /** Mostrar siempre (incluso cuando está conectado) */
  @Input() alwaysShow = false;

  private connectionStatus = inject(ConnectionStatusService);

  // Signals del servicio
  public isConnected = this.connectionStatus.isConnected;
  public statusMessage = this.connectionStatus.statusMessage;
  public statusColor = this.connectionStatus.statusColor;
  public wsStats = this.connectionStatus.wsStats;

  /**
   * Clases CSS para posición.
   */
  get positionClasses(): string {
    const positions = {
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4'
    };
    return positions[this.position];
  }

  /**
   * Clases CSS para fondo según estado.
   */
  get backgroundClasses(): string {
    const color = this.statusColor();
    const backgrounds = {
      green: 'bg-green-500/90',
      yellow: 'bg-yellow-500/90',
      red: 'bg-red-500/90',
      gray: 'bg-gray-500/90'
    };
    return backgrounds[color as keyof typeof backgrounds] || backgrounds.gray;
  }

  /**
   * Clases CSS para el punto indicador.
   */
  get dotClasses(): string {
    const color = this.statusColor();
    const dots = {
      green: 'bg-green-200',
      yellow: 'bg-yellow-200',
      red: 'bg-red-200',
      gray: 'bg-gray-200'
    };
    return dots[color as keyof typeof dots] || dots.gray;
  }

  /**
   * Formatea el tiempo de uptime.
   */
  formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}
```

## 7. Toast Notification Component

### toast-notification.component.ts

```typescript
// src/app/shared/components/toast-notification/toast-notification.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';
import { RealTimeNotification } from '../../../core/models/notification.models';

/**
 * Componente de toast notifications.
 *
 * @example
 * ```html
 * <app-toast-notification></app-toast-notification>
 * ```
 */
@Component({
  selector: 'app-toast-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed z-50 flex flex-col gap-3 pointer-events-none"
      [ngClass]="positionClasses">

      <div
        *ngFor="let notification of notifications()"
        class="toast-notification pointer-events-auto max-w-sm transform transition-all duration-300 ease-in-out"
        [ngClass]="getNotificationClasses(notification)"
        [@slideIn]>

        <div class="flex items-start gap-3 p-4 rounded-lg shadow-lg backdrop-blur-sm">
          <!-- Icon -->
          <div class="flex-shrink-0">
            <svg
              class="w-6 h-6"
              [ngClass]="getIconColor(notification.type)"
              fill="currentColor"
              viewBox="0 0 20 20">
              <path
                *ngIf="notification.type === 'success'"
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"/>
              <path
                *ngIf="notification.type === 'error'"
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"/>
              <path
                *ngIf="notification.type === 'warning'"
                fill-rule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"/>
              <path
                *ngIf="notification.type === 'info'"
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"/>
            </svg>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-gray-900">
              {{ notification.title }}
            </p>
            <p class="mt-1 text-sm text-gray-600">
              {{ notification.message }}
            </p>

            <!-- Action button -->
            <button
              *ngIf="notification.actionUrl"
              (click)="handleAction(notification)"
              class="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700">
              {{ notification.actionLabel || 'Ver más' }}
            </button>
          </div>

          <!-- Close button -->
          <button
            (click)="close(notification.id)"
            class="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .toast-notification {
      animation: slideIn 0.3s ease-out;
    }
  `]
})
export class ToastNotificationComponent {
  private notificationService = inject(NotificationService);

  public notifications = this.notificationService.notifications;
  private config = this.notificationService.getConfig();

  /**
   * Clases CSS para posición.
   */
  get positionClasses(): string {
    const position = this.config.position || 'top-right';
    const positions = {
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'top-center': 'top-4 left-1/2 -translate-x-1/2',
      'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
    };
    return positions[position];
  }

  /**
   * Obtiene clases CSS para la notificación.
   */
  getNotificationClasses(notification: RealTimeNotification): string {
    const baseClasses = 'bg-white border-l-4';
    const typeClasses = {
      info: 'border-blue-500',
      success: 'border-green-500',
      warning: 'border-yellow-500',
      error: 'border-red-500'
    };
    return `${baseClasses} ${typeClasses[notification.type]}`;
  }

  /**
   * Obtiene color del icono.
   */
  getIconColor(type: string): string {
    const colors = {
      info: 'text-blue-500',
      success: 'text-green-500',
      warning: 'text-yellow-500',
      error: 'text-red-500'
    };
    return colors[type as keyof typeof colors] || colors.info;
  }

  /**
   * Cierra una notificación.
   */
  close(id: string): void {
    this.notificationService.remove(id);
  }

  /**
   * Maneja acción de notificación.
   */
  handleAction(notification: RealTimeNotification): void {
    if (notification.actionUrl) {
      // Implementar navegación o acción
      console.log('Action:', notification.actionUrl);
      this.close(notification.id);
    }
  }
}
```

## 8. Ejemplo de Uso: Chat Real-Time

### chat.component.ts

```typescript
// examples/chat.component.ts
import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebSocketService } from '../core/services/websocket.service';
import { NotificationService } from '../core/services/notification.service';
import {
  Payload,
  MessageType,
  TextMessage,
  TypingMessage,
  UserStatusMessage
} from '../core/models/message.models';

interface ChatMessage extends TextMessage {
  id: string;
  timestamp: Date;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col h-screen max-w-4xl mx-auto p-4">
      <h1 class="text-2xl font-bold mb-4">Chat Real-Time</h1>

      <!-- Messages -->
      <div class="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
        <div
          *ngFor="let msg of messages()"
          class="flex"
          [class.justify-end]="msg.userId === currentUserId">

          <div
            class="max-w-xs px-4 py-2 rounded-lg"
            [ngClass]="msg.userId === currentUserId ? 'bg-blue-500 text-white' : 'bg-white text-gray-900'">

            <p class="text-xs font-semibold mb-1">{{ msg.userName }}</p>
            <p class="text-sm">{{ msg.message }}</p>
            <p class="text-xs mt-1 opacity-70">{{ msg.timestamp | date:'shortTime' }}</p>
          </div>
        </div>

        <!-- Typing indicator -->
        <div *ngIf="isTyping()" class="text-sm text-gray-500 italic">
          {{ typingUser() }} está escribiendo...
        </div>
      </div>

      <!-- Input -->
      <div class="flex gap-2">
        <input
          type="text"
          [(ngModel)]="messageText"
          (keyup.enter)="sendMessage()"
          (input)="onTyping()"
          placeholder="Escribe un mensaje..."
          class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />

        <button
          (click)="sendMessage()"
          [disabled]="!messageText.trim()"
          class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed">
          Enviar
        </button>
      </div>
    </div>
  `
})
export class ChatComponent implements OnInit, OnDestroy {
  messages = signal<ChatMessage[]>([]);
  messageText = '';
  currentUserId = 'user-' + Math.random().toString(36).substr(2, 9);
  currentUserName = 'Usuario ' + Math.floor(Math.random() * 1000);

  isTyping = signal(false);
  typingUser = signal('');
  private typingTimeout: any = null;

  constructor(
    private ws: WebSocketService,
    private notifications: NotificationService
  ) {}

  ngOnInit(): void {
    // Conectar al WebSocket
    this.ws.connect({
      url: 'ws://localhost:3000/chat',
      autoReconnect: true,
      heartbeat: true
    });

    // Escuchar mensajes de texto
    this.ws.onMessage<TextMessage>(MessageType.TEXT).subscribe(payload => {
      const chatMsg: ChatMessage = {
        ...payload.data,
        id: payload.id!,
        timestamp: new Date(payload.timestamp)
      };

      this.messages.update(msgs => [...msgs, chatMsg]);

      // Notificación si es de otro usuario
      if (payload.data.userId !== this.currentUserId) {
        this.notifications.info(
          payload.data.userName,
          payload.data.message,
          3000
        );
      }
    });

    // Escuchar typing indicators
    this.ws.onMessage<TypingMessage>(MessageType.TYPING).subscribe(payload => {
      if (payload.data.userId !== this.currentUserId) {
        this.isTyping.set(payload.data.isTyping);
        this.typingUser.set(payload.data.userName);

        if (payload.data.isTyping) {
          setTimeout(() => this.isTyping.set(false), 3000);
        }
      }
    });

    // Escuchar estado de usuarios
    this.ws.onMessage<UserStatusMessage>(MessageType.USER_STATUS).subscribe(payload => {
      const status = payload.data.status === 'online' ? 'se conectó' : 'se desconectó';
      this.notifications.info(
        'Usuario',
        `${payload.data.userName} ${status}`,
        2000
      );
    });
  }

  ngOnDestroy(): void {
    this.ws.disconnect();
  }

  sendMessage(): void {
    if (!this.messageText.trim()) return;

    const message: TextMessage = {
      message: this.messageText,
      userId: this.currentUserId,
      userName: this.currentUserName
    };

    const payload: Payload<TextMessage> = {
      type: MessageType.TEXT,
      data: message,
      timestamp: new Date().toISOString()
    };

    this.ws.send(payload);
    this.messageText = '';
  }

  onTyping(): void {
    clearTimeout(this.typingTimeout);

    const typing: TypingMessage = {
      userId: this.currentUserId,
      userName: this.currentUserName,
      isTyping: true
    };

    const payload: Payload<TypingMessage> = {
      type: MessageType.TYPING,
      data: typing,
      timestamp: new Date().toISOString()
    };

    this.ws.send(payload);

    this.typingTimeout = setTimeout(() => {
      typing.isTyping = false;
      this.ws.send({
        type: MessageType.TYPING,
        data: typing,
        timestamp: new Date().toISOString()
      });
    }, 1000);
  }
}
```

## 9. Testing

### websocket.service.spec.ts

```typescript
// websocket.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { WebSocketService } from './websocket.service';
import { MessageType, Payload } from '../models/message.models';
import { ConnectionState } from '../models/connection.models';
import WS from 'jest-websocket-mock';

describe('WebSocketService', () => {
  let service: WebSocketService;
  let mockServer: WS;
  const wsUrl = 'ws://localhost:3000';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WebSocketService]
    });

    service = TestBed.inject(WebSocketService);
    mockServer = new WS(wsUrl);
  });

  afterEach(() => {
    WS.clean();
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should connect to WebSocket server', async () => {
    service.connect({ url: wsUrl });

    await mockServer.connected;

    expect(service.isConnected()).toBe(true);
    expect(service.getState()).toBe(ConnectionState.CONNECTED);
  });

  it('should send and receive messages', async () => {
    service.connect({ url: wsUrl });
    await mockServer.connected;

    const receivedMessages: Payload[] = [];
    service.messages$.subscribe(msg => receivedMessages.push(msg));

    const testMessage: Payload = {
      type: MessageType.TEXT,
      data: { message: 'Hello' },
      timestamp: new Date().toISOString()
    };

    service.send(testMessage);

    await expect(mockServer).toReceiveMessage(
      expect.objectContaining({
        type: MessageType.TEXT
      })
    );

    mockServer.send(JSON.stringify(testMessage));

    expect(receivedMessages.length).toBe(1);
    expect(receivedMessages[0].type).toBe(MessageType.TEXT);
  });

  it('should queue messages when disconnected', () => {
    const testMessage: Payload = {
      type: MessageType.TEXT,
      data: { message: 'Queued' },
      timestamp: new Date().toISOString()
    };

    service.send(testMessage);

    // Message should be queued
    expect(service['messageQueue'].length).toBe(1);
  });

  it('should auto-reconnect on disconnect', async () => {
    jest.useFakeTimers();

    service.connect({
      url: wsUrl,
      autoReconnect: true,
      reconnectInterval: 1000
    });

    await mockServer.connected;

    mockServer.close();

    expect(service.getState()).toBe(ConnectionState.RECONNECTING);

    jest.advanceTimersByTime(1000);

    jest.useRealTimers();
  });
});
```

## 10. Backend Example (Node.js + ws)

### server.js

```javascript
// backend/server.js
const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = new Map();

wss.on('connection', (ws) => {
  const clientId = generateId();
  clients.set(clientId, ws);

  console.log(`Client connected: ${clientId}`);

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'system',
    data: { message: 'Connected successfully' },
    timestamp: new Date().toISOString()
  }));

  // Handle messages
  ws.on('message', (data) => {
    try {
      const payload = JSON.parse(data);

      console.log('Received:', payload.type);

      // Handle heartbeat
      if (payload.type === 'heartbeat') {
        ws.send(JSON.stringify({
          type: 'heartbeat',
          data: { pong: true },
          timestamp: new Date().toISOString()
        }));
        return;
      }

      // Broadcast to all clients except sender
      broadcast(payload, clientId);

    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  // Handle disconnect
  ws.on('close', () => {
    console.log(`Client disconnected: ${clientId}`);
    clients.delete(clientId);

    // Notify other clients
    broadcast({
      type: 'user_status',
      data: {
        userId: clientId,
        status: 'offline'
      },
      timestamp: new Date().toISOString()
    });
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error(`Client error: ${clientId}`, error);
  });
});

function broadcast(payload, senderId = null) {
  const message = JSON.stringify(payload);

  clients.forEach((client, clientId) => {
    if (client.readyState === WebSocket.OPEN) {
      if (senderId === null || clientId !== senderId) {
        client.send(message);
      }
    }
  });
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
```

## Best Practices

### Seguridad
1. **Autenticación**: Enviar token JWT en conexión inicial
2. **Validación**: Validar todos los mensajes en el servidor
3. **Rate Limiting**: Limitar mensajes por cliente
4. **Sanitización**: Limpiar contenido de mensajes
5. **HTTPS/WSS**: Usar conexiones seguras en producción

### Performance
1. **Message Throttling**: Debounce de typing indicators
2. **Batching**: Agrupar mensajes cuando sea posible
3. **Compression**: Comprimir mensajes grandes
4. **Lazy Loading**: Cargar historial bajo demanda
5. **Virtual Scrolling**: Para listas largas de mensajes

### Resilencia
1. **Exponential Backoff**: Para reconexiones
2. **Message Queue**: Guardar mensajes offline
3. **Heartbeat**: Keep-alive para detectar desconexiones
4. **Error Recovery**: Manejo robusto de errores
5. **Fallback**: SSE o polling como alternativa

### UX
1. **Visual Feedback**: Indicadores de conexión claros
2. **Optimistic Updates**: Mostrar mensajes inmediatamente
3. **Error Messages**: Notificaciones amigables
4. **Retry Options**: Permitir retry manual
5. **Offline Mode**: Funcionalidad básica sin conexión
