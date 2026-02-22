import { useState } from 'react';
import {
  Headphones,
  MessageSquare,
  Search,
  Plus,
  X,
  Clock,
  User,
  Tag,
  CheckCircle,
  Circle,
  AlertCircle,
  Send,
  UserCheck,
  Ticket,
  ChevronRight,
} from 'lucide-react';
import { supportTickets } from '../data/mockData';
import { usePermissions } from '../hooks/usePermissions';

// ===========================
// Sub-componente: PriorityBadge
// ===========================
function PriorityBadge({ priority }) {
  const styles = {
    urgente: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    alta:    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    media:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    baja:    'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  };
  const labels = { urgente: 'Urgente', alta: 'Alta', media: 'Media', baja: 'Baja' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[priority] || styles.baja}`}>
      {labels[priority] || priority}
    </span>
  );
}

// ===========================
// Sub-componente: TicketStatusBadge
// ===========================
function TicketStatusBadge({ status }) {
  const config = {
    open:           { label: 'Abierto',     style: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    in_progress:    { label: 'En Progreso', style: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
    waiting_client: { label: 'Esperando',   style: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
    resolved:       { label: 'Resuelto',    style: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
    closed:         { label: 'Cerrado',     style: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  };
  const { label, style } = config[status] || config.closed;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}

// ===========================
// Sub-componente: CategoryLabel
// ===========================
function CategoryLabel({ category }) {
  const labels = {
    technical:       'Técnico',
    billing:         'Facturación',
    access:          'Acceso',
    feature_request: 'Solicitud',
    other:           'Otro',
  };
  return <span className="text-gray-500 dark:text-gray-400 text-sm">{labels[category] || category}</span>;
}

// ===========================
// Sub-componente: KPICard
// ===========================
function KPICard({ label, value, icon: Icon, color }) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-300">{label}</p>
    </div>
  );
}

// ===========================
// Sub-componente: TicketDetailModal
// ===========================
function TicketDetailModal({ ticket, onClose, onStatusChange, onAddComment, canUpdateTickets, canAssignTickets, canCloseTickets }) {
  const [replyText, setReplyText] = useState('');
  const [newStatus, setNewStatus] = useState(ticket.status);

  const categoryLabels = {
    technical: 'Técnico', billing: 'Facturación',
    access: 'Acceso', feature_request: 'Solicitud', other: 'Otro',
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleSend = () => {
    if (!replyText.trim()) return;
    onAddComment(ticket.id, replyText.trim());
    setReplyText('');
  };

  const handleStatusSave = () => {
    if (newStatus !== ticket.status) {
      onStatusChange(ticket.id, newStatus);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Panel lateral */}
      <div className="w-[480px] bg-white dark:bg-gray-800 h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{ticket.id}</span>
            <TicketStatusBadge status={ticket.status} />
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Asunto */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white leading-snug">{ticket.subject}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{ticket.description}</p>
          </div>

          {/* Meta info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <User className="w-4 h-4 text-gray-400" />
              <span className="font-medium">{ticket.clientName}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <Tag className="w-4 h-4 text-gray-400" />
              <CategoryLabel category={ticket.category} />
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <AlertCircle className="w-4 h-4 text-gray-400" />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <UserCheck className="w-4 h-4 text-gray-400" />
              <span>{ticket.assignedTo || <span className="text-gray-400 italic">Sin asignar</span>}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 col-span-2">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Creado: {formatDate(ticket.createdAt)}</span>
            </div>
          </div>

          {/* Timeline de comentarios */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Comentarios ({ticket.comments.length})
            </h3>
            {ticket.comments.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic text-center py-4">Sin comentarios aún.</p>
            ) : (
              <div className="space-y-3">
                {ticket.comments.map((c) => (
                  <div key={c.id} className={`flex gap-3 ${c.role === 'agent' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      c.role === 'agent'
                        ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}>
                      {c.author.charAt(0).toUpperCase()}
                    </div>
                    <div className={`flex-1 ${c.role === 'agent' ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className={`rounded-2xl px-4 py-2.5 text-sm max-w-[90%] ${
                        c.role === 'agent'
                          ? 'bg-primary-600 dark:bg-primary-700 text-white rounded-tr-sm'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-sm'
                      }`}>
                        {c.message}
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 px-1">{formatDate(c.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cambiar estado */}
          {(canUpdateTickets() || canCloseTickets()) && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Cambiar estado</h3>
              <div className="flex gap-2">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="flex-1 input-field text-sm"
                >
                  <option value="open">Abierto</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="waiting_client">Esperando Cliente</option>
                  <option value="resolved">Resuelto</option>
                  <option value="closed">Cerrado</option>
                </select>
                <button
                  onClick={handleStatusSave}
                  disabled={newStatus === ticket.status}
                  className="btn-primary text-sm px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Guardar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Reply box */}
        {canUpdateTickets() && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Responder</h3>
            <div className="flex gap-2 items-end">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Escribe una respuesta..."
                rows={2}
                className="flex-1 input-field text-sm resize-none"
              />
              <button
                onClick={handleSend}
                disabled={!replyText.trim()}
                className="btn-primary p-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===========================
// Componente principal: Support
// ===========================
function Support() {
  const { canReadTickets, canCreateTickets, canUpdateTickets, canAssignTickets, canCloseTickets } = usePermissions();

  const [activeTab, setActiveTab] = useState('bandeja');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [tickets, setTickets] = useState(supportTickets);

  const bandejaStatuses = ['open', 'in_progress', 'waiting_client'];
  const historialStatuses = ['resolved', 'closed'];
  const today = '2026-02-22';

  // KPIs
  const totalTickets = tickets.length;
  const openTickets = tickets.filter(t => t.status === 'open').length;
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress' || t.status === 'waiting_client').length;
  const resolvedToday = tickets.filter(t => t.resolvedAt && t.resolvedAt.startsWith(today)).length;

  // Filtrado
  const filtered = tickets.filter(t => {
    const inTab = activeTab === 'bandeja'
      ? bandejaStatuses.includes(t.status)
      : historialStatuses.includes(t.status);
    const matchSearch = !searchQuery ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.clientEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
    const matchCategory = filterCategory === 'all' || t.category === filterCategory;
    return inTab && matchSearch && matchPriority && matchCategory;
  });

  const bandejaCount = tickets.filter(t => bandejaStatuses.includes(t.status)).length;
  const historialCount = tickets.filter(t => historialStatuses.includes(t.status)).length;

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleStatusChange = (ticketId, newStatus) => {
    setTickets(prev => prev.map(t =>
      t.id === ticketId
        ? { ...t, status: newStatus, updatedAt: new Date().toISOString(), resolvedAt: (newStatus === 'resolved' || newStatus === 'closed') ? new Date().toISOString() : t.resolvedAt }
        : t
    ));
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(prev => ({ ...prev, status: newStatus }));
    }
  };

  const handleAddComment = (ticketId, message) => {
    const newComment = {
      id: `c-${Date.now()}`,
      author: 'John Admin',
      role: 'agent',
      message,
      createdAt: new Date().toISOString(),
    };
    setTickets(prev => prev.map(t =>
      t.id === ticketId
        ? { ...t, comments: [...t.comments, newComment], updatedAt: new Date().toISOString() }
        : t
    ));
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(prev => ({ ...prev, comments: [...prev.comments, newComment] }));
    }
  };

  if (!canReadTickets()) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Headphones className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No tienes permisos para ver el soporte.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Soporte y Tickets</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {openTickets} ticket{openTickets !== 1 ? 's' : ''} abierto{openTickets !== 1 ? 's' : ''} pendiente{openTickets !== 1 ? 's' : ''}
          </p>
        </div>
        {canCreateTickets() && (
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Ticket
          </button>
        )}
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Tickets" value={totalTickets} icon={Ticket} color="bg-gray-500" />
        <KPICard label="Abiertos" value={openTickets} icon={Circle} color="bg-blue-500" />
        <KPICard label="En Progreso" value={inProgressTickets} icon={AlertCircle} color="bg-purple-500" />
        <KPICard label="Resueltos Hoy" value={resolvedToday} icon={CheckCircle} color="bg-green-500" />
      </div>

      {/* Tabs + Table */}
      <div className="card">
        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-700 px-6 pt-4">
          {[
            { id: 'bandeja', label: 'Bandeja', count: bandejaCount },
            { id: 'historial', label: 'Historial', count: historialCount },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-700 dark:text-primary-400 dark:border-primary-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
              <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                activeTab === tab.id
                  ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por asunto, cliente o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9 text-sm w-full"
            />
          </div>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="input-field text-sm"
          >
            <option value="all">Todas las prioridades</option>
            <option value="urgente">Urgente</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="input-field text-sm"
          >
            <option value="all">Todas las categorías</option>
            <option value="technical">Técnico</option>
            <option value="billing">Facturación</option>
            <option value="access">Acceso</option>
            <option value="feature_request">Solicitud</option>
            <option value="other">Otro</option>
          </select>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Headphones className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No hay tickets que coincidan</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Intenta con otros filtros o términos de búsqueda</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  {['ID', 'Asunto', 'Cliente', 'Prioridad', 'Estado', 'Categoría', 'Asignado', 'Fecha'].map(col => (
                    <th key={col} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {filtered.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4 text-xs font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {ticket.id}
                    </td>
                    <td className="px-6 py-4 max-w-[220px]">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{ticket.subject}</span>
                        {ticket.comments.length > 0 && (
                          <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 shrink-0">
                            <MessageSquare className="w-3 h-3" />
                            {ticket.comments.length}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{ticket.clientName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{ticket.clientEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <TicketStatusBadge status={ticket.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <CategoryLabel category={ticket.category} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {ticket.assignedTo || <span className="text-gray-400 italic text-xs">Sin asignar</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(ticket.createdAt)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de detalle */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onStatusChange={handleStatusChange}
          onAddComment={handleAddComment}
          canUpdateTickets={canUpdateTickets}
          canAssignTickets={canAssignTickets}
          canCloseTickets={canCloseTickets}
        />
      )}
    </div>
  );
}

export default Support;
