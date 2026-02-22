import { useState } from 'react';
import {
  CreditCard, Globe, Briefcase, FileText,
  Eye, Edit2, BarChart3, Layout, Download,
  ChevronDown, ChevronRight, ChevronLeft, ChevronRight as ChevronRightIcon,
  Home, Lock, X,
} from 'lucide-react';
import { useFeatureGate } from '../../hooks/useFeatureGate';
import { UpgradePrompt } from './UpgradePrompt';

const SERVICES = [
  {
    id: 'tarjeta',
    label: 'Tarjeta Digital',
    icon: CreditCard,
    modes: [
      { id: 'preview', label: 'Vista Previa', icon: Eye, feature: null },
      { id: 'edit', label: 'Editar', icon: Edit2, feature: null },
      { id: 'analytics', label: 'Estadísticas', icon: BarChart3, feature: 'digitalCardAnalytics' },
    ],
  },
  {
    id: 'landing',
    label: 'Landing Page',
    icon: Globe,
    serviceFeature: 'landingPage',
    modes: [
      { id: 'preview', label: 'Vista Previa', icon: Eye, feature: 'landingPage' },
      { id: 'edit', label: 'Editar', icon: Edit2, feature: 'landingPage' },
      { id: 'templates', label: 'Plantillas', icon: Layout, feature: 'landingPage' },
    ],
  },
  {
    id: 'portafolio',
    label: 'Portafolio',
    icon: Briefcase,
    serviceFeature: 'portfolio',
    modes: [
      { id: 'preview', label: 'Vista Previa', icon: Eye, feature: 'portfolio' },
      { id: 'edit', label: 'Editar', icon: Edit2, feature: 'portfolio' },
      { id: 'projects', label: 'Proyectos', icon: Briefcase, feature: 'portfolio' },
    ],
  },
  {
    id: 'cv',
    label: 'CV Digital',
    icon: FileText,
    modes: [
      { id: 'preview', label: 'Vista Previa', icon: Eye, feature: null },
      { id: 'edit', label: 'Editar', icon: Edit2, feature: null },
      { id: 'templates', label: 'Plantillas', icon: FileText, feature: null },
      { id: 'export', label: 'Exportar PDF', icon: Download, feature: 'cvPDFExport' },
    ],
  },
];

export const Sidebar = ({ activeService, activeMode, onNavigate, isOpen, onClose, isCollapsed, onCollapsedChange }) => {
  const [expandedServices, setExpandedServices] = useState(new Set([activeService]));
  const [upgradeInfo, setUpgradeInfo] = useState(null);
  const { hasFeature, getUpgradeMessage } = useFeatureGate();

  const toggleService = (serviceId) => {
    setExpandedServices(prev => {
      const next = new Set(prev);
      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }
      return next;
    });
  };

  const handleModeClick = (service, mode) => {
    const featureKey = mode.feature;
    if (featureKey && !hasFeature(featureKey)) {
      setUpgradeInfo(getUpgradeMessage(featureKey));
      return;
    }
    onNavigate(service.id, mode.id);
    if (onClose) onClose(); // close mobile drawer
  };

  const handleServiceClick = (service) => {
    if (isCollapsed) {
      onCollapsedChange(false);
      setExpandedServices(prev => new Set([...prev, service.id]));
      return;
    }
    toggleService(service.id);
    // Navigate to service with default mode on service click
    if (activeService !== service.id) {
      onNavigate(service.id, 'preview');
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 left-0 h-[calc(100vh-4rem)] z-40
          bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          flex flex-col transition-all duration-300 overflow-hidden
          ${isCollapsed ? 'w-16' : 'w-64'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Collapse toggle */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 min-h-[52px]">
          {!isCollapsed && (
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">
              Vista Digital
            </span>
          )}
          <div className="flex items-center gap-1 ml-auto">
            {isOpen && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 md:hidden"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onCollapsedChange(!isCollapsed)}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors hidden md:flex"
              title={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            >
              {isCollapsed ? (
                <ChevronRightIcon className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Home button */}
        <button
          onClick={() => { onNavigate('dashboard', 'preview'); if (onClose) onClose(); }}
          className={`sidebar-item flex items-center gap-3 mx-2 mt-2 ${activeService === 'dashboard' ? 'sidebar-item-active' : ''}`}
          title="Inicio"
        >
          <Home className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="text-sm">Inicio</span>}
        </button>

        {/* Services */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {SERVICES.map((service) => {
            const ServiceIcon = service.icon;
            const isExpanded = expandedServices.has(service.id);
            const isActive = activeService === service.id;
            const serviceFeatureLocked = service.serviceFeature && !hasFeature(service.serviceFeature);

            return (
              <div key={service.id} className="mb-1">
                {/* Service header */}
                <button
                  onClick={() => handleServiceClick(service)}
                  className={`sidebar-item w-full flex items-center gap-3 ${isActive ? 'sidebar-item-active' : ''}`}
                  title={service.label}
                >
                  <ServiceIcon className="w-5 h-5 shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="text-sm flex-1 text-left">{service.label}</span>
                      {serviceFeatureLocked && (
                        <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      )}
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 shrink-0" />
                      )}
                    </>
                  )}
                </button>

                {/* Sub-items (accordion) */}
                {!isCollapsed && isExpanded && (
                  <div className="ml-2 mt-1 space-y-0.5">
                    {service.modes.map((mode) => {
                      const ModeIcon = mode.icon;
                      const isModeLocked = mode.feature && !hasFeature(mode.feature);
                      const isModeActive = isActive && activeMode === mode.id;

                      return (
                        <button
                          key={mode.id}
                          onClick={() => handleModeClick(service, mode)}
                          className={`sidebar-subitem w-full flex items-center gap-2.5 ${isModeActive ? 'sidebar-subitem-active' : ''}`}
                          title={isModeLocked ? `${mode.label} (requiere plan superior)` : mode.label}
                        >
                          <ModeIcon className="w-4 h-4 shrink-0" />
                          <span className="text-xs flex-1 text-left">{mode.label}</span>
                          {isModeLocked && (
                            <Lock className="w-3 h-3 text-gray-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Upgrade prompt */}
      {upgradeInfo && (
        <UpgradePrompt
          isOpen={!!upgradeInfo}
          onClose={() => setUpgradeInfo(null)}
          featureInfo={upgradeInfo}
        />
      )}
    </>
  );
};
