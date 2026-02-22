import { useState } from 'react';
import {
  Bell,
  Shield,
  Users,
  CreditCard,
  Settings,
  Key,
  X,
  CheckCheck,
  ShieldOff,
  UserPlus,
  FileText,
  Zap,
  Lock,
  Mail,
  Database,
  AlertTriangle,
} from 'lucide-react';
import { notifications as initialNotifications } from '../data/mockData';

const ICON_MAP = {
  Shield,
  ShieldOff,
  Users,
  UserPlus,
  CreditCard,
  FileText,
  Settings,
  AlertTriangle,
  Zap,
  Lock,
  Mail,
  Key,
  Database,
};

const CATEGORY_COLORS = {
  security: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  users:    'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  billing:  'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  system:   'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  roles:    'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
};

const FILTER_LABELS = {
  all:      'Todas',
  unread:   'Sin leer',
  security: 'Seguridad',
  users:    'Usuarios',
  billing:  'Facturación',
  system:   'Sistema',
  roles:    'Roles',
};

function timeAgo(isoString) {
  const date = new Date(isoString);
  const now = new Date('2026-02-22T12:00:00');
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return 'Hace un momento';
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
  return `Hace ${Math.floor(diff / 86400)} días`;
}

function NotificationItem({ notif, onDismiss, onMarkRead }) {
  const IconComponent = ICON_MAP[notif.icon] || Bell;
  const colorClass = CATEGORY_COLORS[notif.category] || CATEGORY_COLORS.system;

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
        notif.read
          ? 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800'
          : 'border-primary-100 dark:border-primary-800/40 bg-primary-50/30 dark:bg-primary-900/10'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        <IconComponent className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {notif.title}
            </p>
            {!notif.read && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                Nueva
              </span>
            )}
          </div>
          <button
            onClick={() => onDismiss(notif.id)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0"
            aria-label="Descartar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{notif.message}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(notif.time)}</span>
          {!notif.read && (
            <button
              onClick={() => onMarkRead(notif.id)}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
            >
              Marcar como leída
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Notifications() {
  const [items, setItems] = useState(initialNotifications);
  const [filter, setFilter] = useState('all');

  const unreadCount = items.filter((n) => !n.read).length;

  const filteredItems = items.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'all') return true;
    return n.category === filter;
  });

  const handleDismiss = (id) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
  };

  const handleMarkRead = (id) => {
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const filters = ['all', 'unread', 'security', 'users', 'billing', 'system', 'roles'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notificaciones</h1>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
          >
            <CheckCheck className="w-4 h-4" />
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {FILTER_LABELS[f]}
            {f === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/20 text-xs">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filteredItems.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            No hay notificaciones{filter !== 'all' ? ` en "${FILTER_LABELS[filter]}"` : ''}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((notif) => (
            <NotificationItem
              key={notif.id}
              notif={notif}
              onDismiss={handleDismiss}
              onMarkRead={handleMarkRead}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Notifications;
