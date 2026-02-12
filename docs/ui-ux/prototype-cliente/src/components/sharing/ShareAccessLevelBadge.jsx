import React from 'react';
import { Eye, MessageCircle, Edit3, Shield } from 'lucide-react';

/**
 * Badge component para mostrar niveles de acceso de compartición
 *
 * Props:
 * - level: 'viewer' | 'commenter' | 'editor' | 'admin'
 * - size: 'sm' | 'md' (default: 'md')
 */
export default function ShareAccessLevelBadge({ level, size = 'md' }) {
  // Config por nivel de acceso usando CSS classes con dark mode
  const config = {
    viewer: {
      label: 'Visualizador',
      icon: Eye,
      className: 'badge-share-viewer'
    },
    commenter: {
      label: 'Comentador',
      icon: MessageCircle,
      className: 'badge-share-commenter'
    },
    editor: {
      label: 'Editor',
      icon: Edit3,
      className: 'badge-share-editor'
    },
    admin: {
      label: 'Administrador',
      icon: Shield,
      className: 'badge-share-admin'
    }
  };

  const levelConfig = config[level] || config.viewer;
  const Icon = levelConfig.icon;

  // Size classes
  const sizeClasses = {
    sm: {
      container: 'px-2 py-0.5 text-xs',
      icon: 'w-3 h-3'
    },
    md: {
      container: 'px-2.5 py-1 text-sm',
      icon: 'w-4 h-4'
    }
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        ${levelConfig.className}
        ${currentSize.container}
      `}
    >
      <Icon className={currentSize.icon} />
      <span>{levelConfig.label}</span>
    </span>
  );
}
