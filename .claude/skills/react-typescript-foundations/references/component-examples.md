# Component Examples - Componentes Completos Listos para Usar

Ejemplos completos de componentes comunes con TypeScript, totalmente funcionales y listos para copy-paste.

## Button Component

Componente Button flexible con variantes, tamaños, loading state e iconos.

```tsx
import { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  className = '',
  ...props
}) => {
  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
  };

  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const baseClasses =
    'inline-flex items-center justify-center rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    className,
  ].join(' ');

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!loading && icon && iconPosition === 'left' && (
        <span className="mr-2">{icon}</span>
      )}
      {children}
      {!loading && icon && iconPosition === 'right' && (
        <span className="ml-2">{icon}</span>
      )}
    </button>
  );
};

// Ejemplos de uso
const Examples = () => (
  <>
    <Button variant="primary">Primary</Button>
    <Button variant="secondary" size="sm">Small Secondary</Button>
    <Button variant="danger" loading>Loading...</Button>
    <Button icon={<span>🚀</span>}>With Icon</Button>
    <Button icon={<span>→</span>} iconPosition="right">Next</Button>
    <Button fullWidth>Full Width</Button>
  </>
);
```

## Input Component

Input con label, error state, validación y diferentes tipos.

```tsx
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const hasError = !!error;

    const inputClasses = [
      'block px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors',
      hasError
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
      fullWidth ? 'w-full' : '',
      className,
    ].join(' ');

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <input ref={ref} className={inputClasses} {...props} />

        {error && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {!error && helperText && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Ejemplo de uso con validación
const FormExample = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError('Email is required');
    } else if (!/\S+@\S+\.\S+/.test(value)) {
      setEmailError('Invalid email format');
    } else {
      setEmailError('');
    }
  };

  return (
    <>
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          validateEmail(e.target.value);
        }}
        error={emailError}
        helperText="We'll never share your email"
        required
        fullWidth
      />

      <Input
        label="Password"
        type="password"
        placeholder="Enter password"
        helperText="Must be at least 8 characters"
        fullWidth
      />
    </>
  );
};
```

## Card Component

Card con header, body, footer usando composición.

```tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  shadow = 'md',
  hover = false,
}) => {
  const paddingClasses: Record<string, string> = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const shadowClasses: Record<string, string> = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  };

  const classes = [
    'bg-white rounded-lg border border-gray-200',
    paddingClasses[padding],
    shadowClasses[shadow],
    hover ? 'transition-shadow hover:shadow-xl cursor-pointer' : '',
    className,
  ].join(' ');

  return <div className={classes}>{children}</div>;
};

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  actions,
}) => (
  <div className="flex items-start justify-between border-b border-gray-200 pb-3 mb-3">
    <div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
    {actions && <div className="ml-4">{actions}</div>}
  </div>
);

interface CardBodyProps {
  children: React.ReactNode;
}

export const CardBody: React.FC<CardBodyProps> = ({ children }) => (
  <div className="text-gray-700">{children}</div>
);

interface CardFooterProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  align = 'right',
}) => {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  return (
    <div
      className={`flex gap-2 border-t border-gray-200 pt-3 mt-3 ${alignClasses[align]}`}
    >
      {children}
    </div>
  );
};

// Ejemplo de uso
const CardExample = () => (
  <Card hover>
    <CardHeader
      title="User Profile"
      subtitle="Manage your account settings"
      actions={
        <Button variant="ghost" size="sm">
          Edit
        </Button>
      }
    />
    <CardBody>
      <p>Name: John Doe</p>
      <p>Email: john@example.com</p>
    </CardBody>
    <CardFooter>
      <Button variant="secondary">Cancel</Button>
      <Button variant="primary">Save</Button>
    </CardFooter>
  </Card>
);
```

## Modal Component

Modal con overlay, animaciones y keyboard handling.

```tsx
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEsc = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const sizeClasses: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  // Handle ESC key
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, closeOnEsc, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements?.[0] as HTMLElement;
    firstElement?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 transition-opacity"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

// Ejemplo de uso
const ModalExample = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm Action"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsOpen(false)}>
              Confirm
            </Button>
          </>
        }
      >
        <p>Are you sure you want to perform this action?</p>
      </Modal>
    </>
  );
};
```

## Table Component

Tabla genérica con sorting, selección y acciones.

```tsx
interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  keyExtractor?: (item: T) => string | number;
  emptyMessage?: string;
  hoverable?: boolean;
  striped?: boolean;
}

export function Table<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  keyExtractor = (item) => item.id,
  emptyMessage = 'No data available',
  hoverable = true,
  striped = false,
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: keyof T | string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0;

    const aValue = a[sortKey];
    const bValue = b[sortKey];

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">{emptyMessage}</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                scope="col"
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  column.sortable ? 'cursor-pointer select-none' : ''
                }`}
                onClick={() => column.sortable && handleSort(column.key)}
                style={{ width: column.width }}
              >
                <div className="flex items-center gap-2">
                  {column.header}
                  {column.sortable && (
                    <span className="text-gray-400">
                      {sortKey === column.key ? (
                        sortOrder === 'asc' ? (
                          '↑'
                        ) : (
                          '↓'
                        )
                      ) : (
                        <span className="opacity-50">↕</span>
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody
          className={`bg-white divide-y divide-gray-200 ${
            striped ? 'divide-y-0' : ''
          }`}
        >
          {sortedData.map((item, index) => (
            <tr
              key={keyExtractor(item)}
              onClick={() => onRowClick?.(item)}
              className={`
                ${striped && index % 2 === 0 ? 'bg-gray-50' : ''}
                ${hoverable ? 'hover:bg-gray-100' : ''}
                ${onRowClick ? 'cursor-pointer' : ''}
              `}
            >
              {columns.map((column) => (
                <td
                  key={String(column.key)}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                >
                  {column.render
                    ? column.render(item)
                    : String(item[column.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Ejemplo de uso
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
}

const UsersTable = () => {
  const users: User[] = [
    { id: 1, name: 'Alice', email: 'alice@example.com', role: 'Admin', status: 'active' },
    { id: 2, name: 'Bob', email: 'bob@example.com', role: 'User', status: 'active' },
  ];

  const columns: Column<User>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'role', header: 'Role', sortable: true },
    {
      key: 'status',
      header: 'Status',
      render: (user) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            user.status === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {user.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost">
            Edit
          </Button>
          <Button size="sm" variant="ghost">
            Delete
          </Button>
        </div>
      ),
      width: '150px',
    },
  ];

  return (
    <Table
      data={users}
      columns={columns}
      onRowClick={(user) => console.log('Clicked:', user.name)}
      hoverable
      striped
    />
  );
};
```

## Select Component

Select dropdown con búsqueda y opciones múltiples.

```tsx
import { useState, useRef } from 'react';
import { useClickOutside } from '../hooks/useClickOutside';

interface Option {
  value: string | number;
  label: string;
}

interface SelectProps {
  options: Option[];
  value: string | number | (string | number)[];
  onChange: (value: string | number | (string | number)[]) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  searchable?: boolean;
  multiple?: boolean;
  disabled?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  label,
  error,
  searchable = false,
  multiple = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);

  useClickOutside(selectRef, () => setIsOpen(false));

  const selectedValues = Array.isArray(value) ? value : [value];

  const filteredOptions = searchable
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const handleSelect = (optionValue: string | number) => {
    if (multiple) {
      const currentValues = selectedValues;
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter((v) => v !== optionValue)
        : [...currentValues, optionValue];
      onChange(newValues);
    } else {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  const selectedLabels = options
    .filter((opt) => selectedValues.includes(opt.value))
    .map((opt) => opt.label)
    .join(', ');

  return (
    <div className="relative" ref={selectRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2 text-left border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
      >
        <span className={selectedLabels ? '' : 'text-gray-400'}>
          {selectedLabels || placeholder}
        </span>
        <span className="float-right">▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {searchable && (
            <div className="p-2 border-b">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {filteredOptions.length === 0 ? (
            <div className="p-3 text-gray-500 text-center">No options found</div>
          ) : (
            filteredOptions.map((option) => {
              const isSelected = selectedValues.includes(option.value);

              return (
                <div
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                    isSelected ? 'bg-blue-50 text-blue-700 font-medium' : ''
                  }`}
                >
                  {multiple && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="mr-2"
                    />
                  )}
                  {option.label}
                </div>
              );
            })
          )}
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

// Ejemplo de uso
const SelectExample = () => {
  const [selected, setSelected] = useState<string>('');
  const [multiSelected, setMultiSelected] = useState<(string | number)[]>([]);

  const options: Option[] = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
    { value: '3', label: 'Option 3' },
  ];

  return (
    <>
      <Select
        options={options}
        value={selected}
        onChange={(val) => setSelected(val as string)}
        label="Single Select"
        placeholder="Choose one..."
        searchable
      />

      <Select
        options={options}
        value={multiSelected}
        onChange={(val) => setMultiSelected(val as (string | number)[])}
        label="Multiple Select"
        placeholder="Choose multiple..."
        multiple
        searchable
      />
    </>
  );
};
```

## Resumen de Componentes

| Componente | Features | Use Cases |
|------------|----------|-----------|
| Button | Variants, sizes, loading, icons | Forms, actions, navigation |
| Input | Validation, error states, types | Forms, search, data entry |
| Card | Composición, hover, shadow | Content containers, cards |
| Modal | Portal, keyboard, focus trap | Dialogs, confirmations |
| Table | Sorting, striped, clickable | Data display, admin panels |
| Select | Search, multiple, disabled | Forms, filters, dropdowns |

Todos los componentes están tipados con TypeScript, son accesibles (ARIA), y siguen las mejores prácticas de React.
