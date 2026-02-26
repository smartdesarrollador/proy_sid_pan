---
name: ui-base-components
description: "Componentes UI reutilizables con código React+Tailwind listo para copiar, extraídos de los prototipos del proyecto. Usar cuando se necesite implementar: botones (primary/secondary/danger/ghost), inputs/form fields, cards con variantes, badges de estado (todo/in_progress/in_review/done) y prioridad (alta/media/baja), alerts/notificaciones, avatares con iniciales, tablas responsive, modales con overlay, y el index.css con clases @layer components. Incluye dark mode en todos los componentes y corresponde exactamente a los estilos de los prototipos."
---

# UI Base Components — Componentes Reutilizables React + Tailwind

Biblioteca de componentes UI listos para copiar, basados en `docs/ui-ux/prototype-admin/src/index.css` y los
componentes compartidos del prototipo. Todos los componentes incluyen dark mode.

## 1. index.css — Clases Custom (@layer components)

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100;
  }
}

@layer components {
  /* ===== BOTONES ===== */
  .btn {
    @apply px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2;
  }

  .btn-primary {
    @apply bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500;
  }

  .btn-secondary {
    @apply bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 focus:ring-gray-500;
  }

  .btn-danger {
    @apply bg-red-600 text-white hover:bg-red-700 focus:ring-red-500;
  }

  .btn-ghost {
    @apply bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500;
  }

  /* ===== CARDS ===== */
  .card {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700;
  }

  .card-hover {
    @apply transition-shadow hover:shadow-md cursor-pointer;
  }

  /* ===== INPUTS ===== */
  .input {
    @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent;
  }

  /* ===== BADGES BASE ===== */
  .badge {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
  }

  /* Badges de estado */
  .badge-todo {
    @apply bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200;
  }

  .badge-in-progress {
    @apply bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300;
  }

  .badge-in-review {
    @apply bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300;
  }

  .badge-done {
    @apply bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300;
  }

  /* Badges de prioridad */
  .priority-alta {
    @apply bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300;
  }

  .priority-media {
    @apply bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300;
  }

  .priority-baja {
    @apply bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300;
  }

  /* ===== AVATAR ===== */
  .avatar {
    @apply inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 text-white text-sm font-medium;
  }

  /* ===== EMPTY STATE ===== */
  .empty-state {
    @apply flex flex-col items-center justify-center py-12 px-4 text-center;
  }

  /* ===== DRAG STATE ===== */
  .drag-active {
    @apply border-2 border-primary-500 border-dashed bg-primary-50 dark:bg-primary-900/20;
  }
}
```

---

## 2. Botones

### 2.1 Variantes usando clases custom

```tsx
// Botón primario
<button className="btn btn-primary">
  Guardar cambios
</button>

// Botón secundario
<button className="btn btn-secondary">
  Cancelar
</button>

// Botón de peligro
<button className="btn btn-danger">
  Eliminar
</button>

// Botón ghost (sin fondo)
<button className="btn btn-ghost">
  Ver más
</button>

// Botón deshabilitado (aplica a todos)
<button className="btn btn-primary opacity-50 cursor-not-allowed" disabled>
  Guardando...
</button>
```

### 2.2 Botones con icono

```tsx
import { Plus, Trash2, Edit, Download } from 'lucide-react';

// Botón con icono izquierda
<button className="btn btn-primary flex items-center gap-2">
  <Plus className="w-4 h-4" />
  Nuevo usuario
</button>

// Botón icon only (circular)
<button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
  <Edit className="w-4 h-4 text-gray-600 dark:text-gray-300" />
</button>

// Botón icon de peligro
<button className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
</button>
```

### 2.3 Componente Button TypeScript

```tsx
// components/ui/Button.tsx
import { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  danger:    'btn-danger',
  ghost:     'btn-ghost',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: '',           // usa el default del .btn
  lg: 'px-6 py-3 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'btn',
        variantClasses[variant],
        sizeClasses[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
```

---

## 3. Inputs y Formularios

### 3.1 Input básico

```tsx
// Input con label (patrón estándar del proyecto)
<div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
    Email
  </label>
  <input
    type="email"
    placeholder="usuario@empresa.com"
    className="input"
  />
</div>
```

### 3.2 Input con estado de error

```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
    Nombre
  </label>
  <input
    type="text"
    className="input border-red-500 focus:ring-red-500"
  />
  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
    Este campo es obligatorio
  </p>
</div>
```

### 3.3 Input con icono

```tsx
import { Search } from 'lucide-react';

<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
  <input
    type="text"
    placeholder="Buscar usuarios..."
    className="input pl-9"
  />
</div>
```

### 3.4 Select

```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
    Rol
  </label>
  <select className="input">
    <option value="">Seleccionar rol</option>
    <option value="admin">Admin</option>
    <option value="member">Member</option>
  </select>
</div>
```

### 3.5 Textarea

```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
    Descripción
  </label>
  <textarea
    rows={4}
    className="input resize-none"
    placeholder="Descripción del proyecto..."
  />
</div>
```

### 3.6 Componente FormField TypeScript

```tsx
// components/ui/FormField.tsx
interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}

export function FormField({ label, error, children, required }: FormFieldProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
```

---

## 4. Cards

### 4.1 Card básica

```tsx
<div className="card p-6">
  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
    Título de la card
  </h3>
  <p className="text-sm text-gray-600 dark:text-gray-300">
    Contenido de la card.
  </p>
</div>
```

### 4.2 Card con hover (clicable)

```tsx
<div className="card card-hover p-6">
  <p className="text-sm text-gray-700 dark:text-gray-300">
    Esta card es interactiva
  </p>
</div>
```

### 4.3 Dashboard Metric Card

```tsx
import { Users } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  icon: React.ElementType;
  iconColor: string;   // ej: 'bg-blue-500'
  percentage?: number; // si se muestra progress bar
}

function MetricCard({ label, value, change, icon: Icon, iconColor, percentage }: MetricCardProps) {
  return (
    <div className="card p-6">
      {/* Ícono con fondo coloreado */}
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${iconColor} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Valor principal */}
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        {value}
      </h3>

      {/* Label */}
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
        {label}
      </p>

      {/* Progress bar opcional */}
      {percentage !== undefined && percentage !== null && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
            <span>{change}</span>
            <span>{Math.round(percentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-primary-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Change sin progress bar */}
      {percentage === undefined && change && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {change}
        </p>
      )}
    </div>
  );
}

// Uso en dashboard
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <MetricCard
    label="Usuarios Activos"
    value="45/50"
    change="+3 este mes"
    icon={Users}
    iconColor="bg-blue-500"
    percentage={90}
  />
</div>
```

### 4.4 Card con gradiente (CTA)

```tsx
// Usado en el sidebar para upgrade prompts
<div className="bg-gradient-to-br from-primary-500 to-primary-700 dark:from-primary-600 dark:to-primary-800 rounded-xl p-4 text-white">
  <h3 className="font-semibold text-sm mb-2">¿Necesitas más usuarios?</h3>
  <p className="text-xs text-primary-100 dark:text-primary-200 mb-3">
    Actualiza a Enterprise para usuarios ilimitados
  </p>
  <button className="w-full bg-white dark:bg-gray-700 text-primary-700 dark:text-primary-300 text-xs font-medium py-2 px-3 rounded-lg hover:bg-primary-50 dark:hover:bg-gray-600 transition-colors">
    Ver planes
  </button>
</div>
```

---

## 5. Badges de Estado y Prioridad

### 5.1 Componente StatusBadge

```tsx
// components/shared/StatusBadge.tsx
type Status = 'todo' | 'in_progress' | 'in_review' | 'done';

const statusStyles: Record<Status, string> = {
  todo:        'badge-todo',
  in_progress: 'badge-in-progress',
  in_review:   'badge-in-review',
  done:        'badge-done',
};

const statusLabels: Record<Status, string> = {
  todo:        'Por Hacer',
  in_progress: 'En Progreso',
  in_review:   'En Revisión',
  done:        'Completado',
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`badge ${statusStyles[status] ?? statusStyles.todo}`}>
      {statusLabels[status] ?? 'Por Hacer'}
    </span>
  );
}

// Uso
<StatusBadge status="in_progress" />
<StatusBadge status="done" />
```

### 5.2 Componente PriorityBadge

```tsx
// components/shared/PriorityBadge.tsx
type Priority = 'alta' | 'media' | 'baja';

const priorityStyles: Record<Priority, string> = {
  alta:  'priority-alta',
  media: 'priority-media',
  baja:  'priority-baja',
};

const priorityLabels: Record<Priority, string> = {
  alta:  'Alta',
  media: 'Media',
  baja:  'Baja',
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`badge ${priorityStyles[priority]}`}>
      {priorityLabels[priority]}
    </span>
  );
}

// Uso
<PriorityBadge priority="alta" />
<PriorityBadge priority="media" />
```

### 5.3 Badges inline (sin componente)

```tsx
// Badge success
<span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
  Activo
</span>

// Badge de plan
<span className="badge bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
  Professional
</span>

// Badge de número
<span className="min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold px-0.5">
  9+
</span>
```

---

## 6. Alerts y Notificaciones

### 6.1 Variantes de Alert

```tsx
import { CheckCircle2, AlertCircle, XCircle, Info } from 'lucide-react';

// Alert de éxito
<div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
  <p className="text-sm text-green-700 dark:text-green-300">
    Los cambios se guardaron correctamente.
  </p>
</div>

// Alert de advertencia
<div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg">
  <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
  <p className="text-sm text-orange-700 dark:text-orange-300">
    Tu plan alcanza el 90% de usuarios.
  </p>
</div>

// Alert de error
<div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
  <p className="text-sm text-red-700 dark:text-red-300">
    Error al guardar. Intenta de nuevo.
  </p>
</div>

// Alert de info
<div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
  <p className="text-sm text-blue-700 dark:text-blue-300">
    Rol: <span className="font-semibold">Member</span> — Vista limitada
  </p>
</div>
```

### 6.2 Componente Alert TypeScript

```tsx
// components/ui/Alert.tsx
import { CheckCircle2, AlertCircle, XCircle, Info } from 'lucide-react';

type AlertVariant = 'success' | 'warning' | 'danger' | 'info';

interface AlertProps {
  variant: AlertVariant;
  children: React.ReactNode;
}

const alertConfig: Record<AlertVariant, {
  bg: string; border: string; text: string;
  icon: React.ElementType; iconColor: string;
}> = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-700',
    text: 'text-green-700 dark:text-green-300',
    icon: CheckCircle2,
    iconColor: 'text-green-600 dark:text-green-400',
  },
  warning: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-700',
    text: 'text-orange-700 dark:text-orange-300',
    icon: AlertCircle,
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  danger: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-700',
    text: 'text-red-700 dark:text-red-300',
    icon: XCircle,
    iconColor: 'text-red-600 dark:text-red-400',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    border: 'border-blue-200 dark:border-blue-700',
    text: 'text-blue-700 dark:text-blue-300',
    icon: Info,
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
};

export function Alert({ variant, children }: AlertProps) {
  const config = alertConfig[variant];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-3 p-4 ${config.bg} border ${config.border} rounded-lg`}>
      <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0`} />
      <p className={`text-sm ${config.text}`}>{children}</p>
    </div>
  );
}

// Uso
<Alert variant="success">Los cambios se guardaron correctamente.</Alert>
<Alert variant="danger">Error al conectar con el servidor.</Alert>
```

---

## 7. Avatares

### 7.1 Tamaños de avatar

```tsx
// SM: w-8 h-8 (32px) — usuario en navbar, tablas
<div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium">
  JD
</div>

// MD: w-10 h-10 (40px) — listados de usuarios
<div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium">
  JD
</div>

// LG: w-12 h-12 (48px) — perfil, detalle de usuario
<div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
  JD
</div>
```

### 7.2 Componente Avatar TypeScript

```tsx
// components/ui/Avatar.tsx
type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  name: string;
  size?: AvatarSize;
  color?: string;  // clase Tailwind de bg, ej: 'bg-purple-500'
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

export function Avatar({ name, size = 'sm', color = 'bg-primary-600' }: AvatarProps) {
  return (
    <div className={`inline-flex items-center justify-center rounded-full ${color} text-white font-medium ${sizeClasses[size]}`}>
      {getInitials(name)}
    </div>
  );
}

// Uso
<Avatar name="Juan Díaz" />
<Avatar name="María García" size="lg" color="bg-purple-500" />
```

### 7.3 Avatar con icono de usuario

```tsx
import { User } from 'lucide-react';

// Usado en el dropdown del navbar
<div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
  <User className="w-4 h-4 text-primary-600 dark:text-primary-300" />
</div>
```

---

## 8. Tablas

### 8.1 Tabla básica responsive

```tsx
<div className="card overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-200 dark:border-gray-700">
          <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">
            Usuario
          </th>
          <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">
            Rol
          </th>
          <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">
            Estado
          </th>
          <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">
            Acciones
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
        {users.map(user => (
          <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <Avatar name={`${user.firstName} ${user.lastName}`} />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
              </div>
            </td>
            <td className="px-6 py-4">
              <span className="text-sm text-gray-700 dark:text-gray-300">{user.role}</span>
            </td>
            <td className="px-6 py-4">
              <StatusBadge status={user.status} />
            </td>
            <td className="px-6 py-4 text-right">
              <div className="flex items-center justify-end gap-2">
                <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <Edit className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
                <button className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

### 8.2 Tabla vacía con empty state

```tsx
<tbody>
  {items.length === 0 ? (
    <tr>
      <td colSpan={4}>
        <div className="empty-state">
          <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No hay usuarios
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
            Invita al primer usuario de tu organización.
          </p>
          <button className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Agregar usuario
          </button>
        </div>
      </td>
    </tr>
  ) : (
    items.map(item => <TableRow key={item.id} item={item} />)
  )}
</tbody>
```

---

## 9. Modales

### 9.1 Modal básico

```tsx
// Modal con overlay y portal pattern
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  if (!isOpen) return null;

  return (
    // Overlay — fixed sobre todo
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      {/* Contenedor del modal */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          {children}
        </div>

        {/* Footer con acciones */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Uso
<Modal
  isOpen={modalOpen}
  onClose={() => setModalOpen(false)}
  title="Confirmar eliminación"
  footer={
    <>
      <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
        Cancelar
      </button>
      <button className="btn btn-danger" onClick={handleDelete}>
        Eliminar
      </button>
    </>
  }
>
  <p className="text-sm text-gray-600 dark:text-gray-300">
    ¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.
  </p>
</Modal>
```

### 9.2 Modal de formulario

```tsx
<Modal
  isOpen={createUserOpen}
  onClose={() => setCreateUserOpen(false)}
  title="Nuevo usuario"
  footer={
    <>
      <button className="btn btn-secondary" onClick={() => setCreateUserOpen(false)}>
        Cancelar
      </button>
      <button className="btn btn-primary" onClick={handleSubmit}>
        Crear usuario
      </button>
    </>
  }
>
  <div className="space-y-4">
    <FormField label="Nombre" required>
      <input type="text" className="input" placeholder="Juan" />
    </FormField>
    <FormField label="Email" required>
      <input type="email" className="input" placeholder="juan@empresa.com" />
    </FormField>
    <FormField label="Rol">
      <select className="input">
        <option value="member">Member</option>
        <option value="admin">Admin</option>
      </select>
    </FormField>
  </div>
</Modal>
```

---

## 10. Empty States

### 10.1 Componente EmptyState

```tsx
// components/shared/EmptyState.tsx
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {Icon && (
        <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
          <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// Uso
<EmptyState
  icon={Users}
  title="No hay usuarios"
  description="Invita al primer usuario de tu organización para comenzar."
  actionLabel="Invitar usuario"
  onAction={() => setInviteOpen(true)}
/>
```

---

## 11. Skeleton Loaders

```tsx
// Skeleton de metric cards
function MetricCardSkeleton() {
  return (
    <div className="card p-6 animate-pulse">
      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4" />
      <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
    </div>
  );
}

// Skeleton de fila de tabla
function TableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="space-y-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
      </td>
      <td className="px-6 py-4">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
      </td>
    </tr>
  );
}
```
