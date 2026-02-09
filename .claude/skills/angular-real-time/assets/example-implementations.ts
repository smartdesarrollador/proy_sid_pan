/**
 * Ejemplos de implementación para diferentes casos de uso real-time
 */

import { Component, OnInit, signal } from '@angular/core';
import { WebSocketService } from '../core/services/websocket.service';
import { SSEService } from '../core/services/sse.service';
import { NotificationService } from '../core/services/notification.service';
import { MessageType, Payload } from '../core/models/message.models';

// ============================================================================
// EJEMPLO 1: Live Dashboard con Datos en Tiempo Real
// ============================================================================

interface DashboardMetrics {
  cpu: number;
  memory: number;
  activeUsers: number;
  requestsPerSecond: number;
}

@Component({
  selector: 'app-live-dashboard',
  template: `
    <div class="grid grid-cols-4 gap-4">
      <div class="stat-card">
        <h3>CPU</h3>
        <p class="text-3xl">{{ metrics().cpu }}%</p>
      </div>
      <div class="stat-card">
        <h3>Memory</h3>
        <p class="text-3xl">{{ metrics().memory }}%</p>
      </div>
      <div class="stat-card">
        <h3>Active Users</h3>
        <p class="text-3xl">{{ metrics().activeUsers }}</p>
      </div>
      <div class="stat-card">
        <h3>Requests/sec</h3>
        <p class="text-3xl">{{ metrics().requestsPerSecond }}</p>
      </div>
    </div>
  `
})
export class LiveDashboardComponent implements OnInit {
  metrics = signal<DashboardMetrics>({
    cpu: 0,
    memory: 0,
    activeUsers: 0,
    requestsPerSecond: 0
  });

  constructor(
    private ws: WebSocketService
  ) {}

  ngOnInit() {
    this.ws.connect({
      url: 'wss://api.example.com/dashboard',
      heartbeat: true,
      autoReconnect: true
    });

    // Escuchar métricas
    this.ws.onMessage<DashboardMetrics>(MessageType.SYNC).subscribe(payload => {
      this.metrics.set(payload.data);
    });
  }

  ngOnDestroy() {
    this.ws.disconnect();
  }
}

// ============================================================================
// EJEMPLO 2: Notificaciones Real-Time
// ============================================================================

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
}

@Component({
  selector: 'app-notifications',
  template: `
    <div class="notification-bell relative">
      <button (click)="togglePanel()" class="relative">
        <svg class="w-6 h-6" fill="currentColor">
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>
        <span *ngIf="unreadCount() > 0"
              class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {{ unreadCount() }}
        </span>
      </button>

      <!-- Panel de notificaciones -->
      <div *ngIf="showPanel()" class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg">
        <div class="p-4">
          <h3 class="font-bold mb-2">Notificaciones</h3>
          <div *ngFor="let notif of notifications()" class="p-2 border-b">
            <p class="font-semibold">{{ notif.title }}</p>
            <p class="text-sm text-gray-600">{{ notif.message }}</p>
            <p class="text-xs text-gray-400">{{ notif.timestamp | date:'short' }}</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class NotificationsComponent implements OnInit {
  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);
  showPanel = signal(false);

  constructor(
    private ws: WebSocketService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.ws.connect({
      url: 'wss://api.example.com/notifications',
      autoReconnect: true
    });

    // Escuchar notificaciones
    this.ws.onMessage<Notification>(MessageType.NOTIFICATION).subscribe(payload => {
      const notification = payload.data;

      this.notifications.update(list => [notification, ...list]);
      this.unreadCount.update(count => count + 1);

      // Mostrar toast
      this.notificationService.show({
        type: notification.type,
        title: notification.title,
        message: notification.message,
        duration: 5000
      });
    });
  }

  togglePanel() {
    this.showPanel.update(v => !v);
    if (!this.showPanel()) {
      this.markAllAsRead();
    }
  }

  markAllAsRead() {
    this.unreadCount.set(0);
  }

  ngOnDestroy() {
    this.ws.disconnect();
  }
}

// ============================================================================
// EJEMPLO 3: Presence/Online Status
// ============================================================================

interface UserPresence {
  userId: string;
  userName: string;
  status: 'online' | 'away' | 'offline';
  lastSeen?: string;
}

@Component({
  selector: 'app-user-list',
  template: `
    <div class="user-list">
      <h3 class="font-bold mb-4">Online Users ({{ onlineUsers().length }})</h3>

      <div *ngFor="let user of onlineUsers()" class="flex items-center gap-2 p-2">
        <div class="w-3 h-3 rounded-full"
             [ngClass]="{
               'bg-green-500': user.status === 'online',
               'bg-yellow-500': user.status === 'away',
               'bg-gray-400': user.status === 'offline'
             }">
        </div>
        <span>{{ user.userName }}</span>
        <span *ngIf="user.status !== 'online'" class="text-xs text-gray-500">
          {{ user.status }}
        </span>
      </div>
    </div>
  `
})
export class UserListComponent implements OnInit {
  users = signal<Map<string, UserPresence>>(new Map());
  onlineUsers = signal<UserPresence[]>([]);

  constructor(private ws: WebSocketService) {}

  ngOnInit() {
    this.ws.connect({
      url: 'wss://api.example.com/presence',
      heartbeat: true
    });

    // Escuchar cambios de presencia
    this.ws.onMessage<UserPresence>(MessageType.USER_STATUS).subscribe(payload => {
      const user = payload.data;

      this.users.update(map => {
        const newMap = new Map(map);
        newMap.set(user.userId, user);
        return newMap;
      });

      this.updateOnlineUsers();
    });

    // Escuchar lista inicial
    this.ws.onMessage<UserPresence[]>(MessageType.SYNC).subscribe(payload => {
      const userList = payload.data;

      this.users.update(map => {
        const newMap = new Map(map);
        userList.forEach(user => newMap.set(user.userId, user));
        return newMap;
      });

      this.updateOnlineUsers();
    });
  }

  private updateOnlineUsers() {
    const online = Array.from(this.users().values())
      .filter(u => u.status === 'online')
      .sort((a, b) => a.userName.localeCompare(b.userName));

    this.onlineUsers.set(online);
  }

  ngOnDestroy() {
    this.ws.disconnect();
  }
}

// ============================================================================
// EJEMPLO 4: Collaborative Editing (Typing Indicators)
// ============================================================================

interface EditSession {
  documentId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
  cursorPosition?: number;
}

@Component({
  selector: 'app-collaborative-editor',
  template: `
    <div class="editor-container">
      <textarea
        [(ngModel)]="content"
        (input)="onTyping()"
        (blur)="onStopTyping()"
        class="w-full h-64 p-4 border rounded">
      </textarea>

      <!-- Typing indicators -->
      <div class="mt-2 text-sm text-gray-600">
        <span *ngFor="let user of typingUsers()">
          {{ user.userName }} está escribiendo...
        </span>
      </div>

      <!-- Active users -->
      <div class="mt-4">
        <p class="text-sm font-semibold">Editores activos:</p>
        <div class="flex gap-2 mt-2">
          <div *ngFor="let user of activeUsers()"
               class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            {{ user.userName }}
          </div>
        </div>
      </div>
    </div>
  `
})
export class CollaborativeEditorComponent implements OnInit {
  content = '';
  documentId = 'doc-123';
  currentUserId = 'user-' + Math.random().toString(36).substr(2, 9);
  currentUserName = 'Usuario ' + Math.floor(Math.random() * 1000);

  activeUsers = signal<EditSession[]>([]);
  typingUsers = signal<EditSession[]>([]);

  private typingTimeout: any;

  constructor(private ws: WebSocketService) {}

  ngOnInit() {
    this.ws.connect({
      url: 'wss://api.example.com/collaborate',
      autoReconnect: true
    });

    // Unirse al documento
    this.ws.send({
      type: MessageType.SYSTEM,
      data: {
        action: 'join',
        documentId: this.documentId,
        userId: this.currentUserId,
        userName: this.currentUserName
      },
      timestamp: new Date().toISOString()
    });

    // Escuchar cambios de contenido
    this.ws.onMessage<any>(MessageType.SYNC).subscribe(payload => {
      if (payload.userId !== this.currentUserId) {
        this.content = payload.data.content;
      }
    });

    // Escuchar typing indicators
    this.ws.onMessage<EditSession>(MessageType.TYPING).subscribe(payload => {
      const session = payload.data;

      if (session.userId !== this.currentUserId) {
        if (session.isTyping) {
          this.typingUsers.update(users => {
            const filtered = users.filter(u => u.userId !== session.userId);
            return [...filtered, session];
          });

          // Auto-remover después de 3s
          setTimeout(() => {
            this.typingUsers.update(users =>
              users.filter(u => u.userId !== session.userId)
            );
          }, 3000);
        } else {
          this.typingUsers.update(users =>
            users.filter(u => u.userId !== session.userId)
          );
        }
      }
    });

    // Escuchar usuarios activos
    this.ws.onMessage<EditSession[]>(MessageType.USER_STATUS).subscribe(payload => {
      this.activeUsers.set(payload.data);
    });
  }

  onTyping() {
    clearTimeout(this.typingTimeout);

    // Enviar typing indicator
    this.ws.send({
      type: MessageType.TYPING,
      data: {
        documentId: this.documentId,
        userId: this.currentUserId,
        userName: this.currentUserName,
        isTyping: true
      },
      timestamp: new Date().toISOString()
    });

    // Auto-detener después de 1s sin escribir
    this.typingTimeout = setTimeout(() => {
      this.onStopTyping();
    }, 1000);

    // Sync content (debounced)
    this.syncContent();
  }

  onStopTyping() {
    this.ws.send({
      type: MessageType.TYPING,
      data: {
        documentId: this.documentId,
        userId: this.currentUserId,
        userName: this.currentUserName,
        isTyping: false
      },
      timestamp: new Date().toISOString()
    });
  }

  private syncContent() {
    // Debounce sync
    // Implementar debounce aquí
    this.ws.send({
      type: MessageType.SYNC,
      data: {
        documentId: this.documentId,
        content: this.content
      },
      timestamp: new Date().toISOString()
    });
  }

  ngOnDestroy() {
    // Notificar salida
    this.ws.send({
      type: MessageType.SYSTEM,
      data: {
        action: 'leave',
        documentId: this.documentId,
        userId: this.currentUserId
      },
      timestamp: new Date().toISOString()
    });

    this.ws.disconnect();
  }
}

// ============================================================================
// EJEMPLO 5: Live Feed con SSE (Server-Sent Events)
// ============================================================================

interface FeedItem {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  author: string;
}

@Component({
  selector: 'app-live-feed',
  template: `
    <div class="feed-container">
      <h2 class="text-2xl font-bold mb-4">Live Feed</h2>

      <div class="space-y-4">
        <div *ngFor="let item of feedItems()"
             class="p-4 bg-white rounded-lg shadow border-l-4 border-blue-500 animate-slide-in">
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <h3 class="font-semibold text-lg">{{ item.title }}</h3>
              <p class="text-gray-600 mt-1">{{ item.content }}</p>
            </div>
            <span class="text-xs text-gray-400">
              {{ item.timestamp | date:'shortTime' }}
            </span>
          </div>
          <p class="text-sm text-gray-500 mt-2">Por {{ item.author }}</p>
        </div>
      </div>

      <div *ngIf="feedItems().length === 0" class="text-center py-8 text-gray-500">
        Esperando nuevos items...
      </div>
    </div>
  `
})
export class LiveFeedComponent implements OnInit {
  feedItems = signal<FeedItem[]>([]);

  constructor(private sse: SSEService) {}

  ngOnInit() {
    this.sse.connect({
      url: 'https://api.example.com/feed/stream',
      autoReconnect: true
    });

    // Escuchar nuevos items
    this.sse.onEvent<FeedItem>('new-item').subscribe(item => {
      this.feedItems.update(items => [item, ...items].slice(0, 50)); // Limitar a 50
    });

    // Escuchar actualizaciones
    this.sse.onEvent<FeedItem>('item-updated').subscribe(item => {
      this.feedItems.update(items =>
        items.map(i => i.id === item.id ? item : i)
      );
    });

    // Escuchar eliminaciones
    this.sse.onEvent<{ id: string }>('item-deleted').subscribe(({ id }) => {
      this.feedItems.update(items => items.filter(i => i.id !== id));
    });
  }

  ngOnDestroy() {
    this.sse.disconnect();
  }
}

// ============================================================================
// EJEMPLO 6: Real-Time Progress Tracking
// ============================================================================

interface TaskProgress {
  taskId: string;
  taskName: string;
  progress: number;
  status: 'pending' | 'running' | 'completed' | 'error';
  message?: string;
}

@Component({
  selector: 'app-task-progress',
  template: `
    <div class="tasks-container">
      <h2 class="text-2xl font-bold mb-4">Tasks en Progreso</h2>

      <div *ngFor="let task of tasks()" class="mb-4">
        <div class="flex justify-between items-center mb-1">
          <span class="font-medium">{{ task.taskName }}</span>
          <span class="text-sm"
                [ngClass]="{
                  'text-gray-500': task.status === 'pending',
                  'text-blue-500': task.status === 'running',
                  'text-green-500': task.status === 'completed',
                  'text-red-500': task.status === 'error'
                }">
            {{ task.status }}
          </span>
        </div>

        <!-- Progress bar -->
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div class="h-2 rounded-full transition-all duration-300"
               [ngClass]="{
                 'bg-blue-500': task.status === 'running',
                 'bg-green-500': task.status === 'completed',
                 'bg-red-500': task.status === 'error'
               }"
               [style.width.%]="task.progress">
          </div>
        </div>

        <p *ngIf="task.message" class="text-sm text-gray-600 mt-1">
          {{ task.message }}
        </p>
      </div>
    </div>
  `
})
export class TaskProgressComponent implements OnInit {
  tasks = signal<TaskProgress[]>([]);

  constructor(private ws: WebSocketService) {}

  ngOnInit() {
    this.ws.connect({
      url: 'wss://api.example.com/tasks',
      autoReconnect: true
    });

    // Escuchar actualizaciones de progreso
    this.ws.onMessage<TaskProgress>(MessageType.SYNC).subscribe(payload => {
      const task = payload.data;

      this.tasks.update(tasks => {
        const existing = tasks.find(t => t.taskId === task.taskId);

        if (existing) {
          return tasks.map(t => t.taskId === task.taskId ? task : t);
        } else {
          return [...tasks, task];
        }
      });

      // Remover tareas completadas después de 5s
      if (task.status === 'completed') {
        setTimeout(() => {
          this.tasks.update(tasks => tasks.filter(t => t.taskId !== task.taskId));
        }, 5000);
      }
    });
  }

  ngOnDestroy() {
    this.ws.disconnect();
  }
}
