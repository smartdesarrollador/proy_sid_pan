import { useState } from 'react';
import { Plus, List, LayoutGrid, Filter } from 'lucide-react';
import { TaskList } from './TaskList';
import { TaskModal } from './TaskModal';
import { FeatureGate } from '../shared/FeatureGate';
import { UpgradePrompt } from '../shared/UpgradePrompt';
import { useFeatureGate } from '../../hooks/useFeatureGate';
import { usePermissions } from '../../hooks/usePermissions';
import { tasks as initialTasks } from '../../data/mockData';

export const TaskBoard = () => {
  const [tasks, setTasks] = useState(initialTasks);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'kanban'
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { hasFeature, canPerformAction, getUpgradeMessage } = useFeatureGate();
  const { canCreateTasks, canEditTasks, canDeleteTasks } = usePermissions();

  const activeTasks = tasks.filter(t => t.status !== 'done');

  const handleCreateTask = () => {
    // Verificar límite de tareas activas
    if (!canPerformAction('maxActiveTasks', activeTasks.length)) {
      const message = getUpgradeMessage('maxActiveTasks');
      alert(`${message.title}\n\n${message.message}`);
      return;
    }

    if (!canCreateTasks()) {
      alert('No tienes permisos para crear tareas');
      return;
    }

    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task) => {
    if (!canEditTasks()) {
      alert('No tienes permisos para editar tareas');
      return;
    }

    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = (taskId) => {
    if (!canDeleteTasks()) {
      alert('No tienes permisos para eliminar tareas');
      return;
    }

    if (confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
      setTasks(tasks.filter(t => t.id !== taskId));
    }
  };

  const handleSaveTask = (taskData) => {
    if (selectedTask) {
      // Editar
      setTasks(tasks.map(t => t.id === selectedTask.id ? { ...t, ...taskData } : t));
    } else {
      // Crear nuevo
      const newTask = {
        id: `task-${Date.now()}`,
        ...taskData,
        createdBy: 'user-001', // Mock current user
        createdAt: new Date().toISOString().split('T')[0],
        comments: 0,
        subtasks: taskData.subtasks || []
      };
      setTasks([...tasks, newTask]);
    }
    setIsModalOpen(false);
  };

  const handleStatusChange = (taskId, newStatus) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const handleToggleView = () => {
    const newView = viewMode === 'list' ? 'kanban' : 'list';

    // Verificar si tiene acceso a vista Kanban
    if (newView === 'kanban' && !hasFeature('kanbanView')) {
      const message = getUpgradeMessage('kanbanView');
      alert(`${message.title}\n\n${message.message}`);
      return;
    }

    setViewMode(newView);
  };

  // Filtrar tareas
  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const renderKanbanView = () => {
    const columns = [
      { id: 'todo', label: 'Por Hacer', tasks: filteredTasks.filter(t => t.status === 'todo') },
      { id: 'in_progress', label: 'En Progreso', tasks: filteredTasks.filter(t => t.status === 'in_progress') },
      { id: 'in_review', label: 'En Revisión', tasks: filteredTasks.filter(t => t.status === 'in_review') },
      { id: 'done', label: 'Completado', tasks: filteredTasks.filter(t => t.status === 'done') }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map(column => (
          <div key={column.id} className="flex flex-col">
            <div className="card p-3 mb-3 bg-gray-50 dark:bg-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">{column.label}</h3>
              <span className="text-sm text-gray-600 dark:text-gray-300">{column.tasks.length}</span>
            </div>
            <div className="space-y-3">
              {column.tasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Tareas</h1>
        <p className="text-gray-600 dark:text-gray-300">Gestiona tus tareas y proyectos</p>
      </div>

      {/* Toolbar */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={handleCreateTask} className="btn btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nueva Tarea
            </button>

            <button
              onClick={handleToggleView}
              className="btn btn-ghost inline-flex items-center gap-2"
            >
              {viewMode === 'list' ? (
                <>
                  <LayoutGrid className="w-4 h-4" />
                  Vista Kanban
                </>
              ) : (
                <>
                  <List className="w-4 h-4" />
                  Vista Lista
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Buscar tareas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input max-w-xs"
            />

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input max-w-xs"
            >
              <option value="all">Todos los estados</option>
              <option value="todo">Por Hacer</option>
              <option value="in_progress">En Progreso</option>
              <option value="in_review">En Revisión</option>
              <option value="done">Completado</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="input max-w-xs"
            >
              <option value="all">Todas las prioridades</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
        </div>

        {/* Usage info */}
        <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
          Tareas activas: {activeTasks.length} / {hasFeature('maxActiveTasks') ?
            (canPerformAction('maxActiveTasks', Infinity) ? '∞' : hasFeature('maxActiveTasks')) :
            '10'
          }
        </div>
      </div>

      {/* Content */}
      {viewMode === 'kanban' ? (
        hasFeature('kanbanView') ? (
          renderKanbanView()
        ) : (
          <FeatureGate feature="kanbanView" />
        )
      ) : (
        <TaskList
          tasks={filteredTasks}
          onTaskClick={handleEditTask}
          onDelete={handleDeleteTask}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        task={selectedTask}
      />
    </div>
  );
};

// Componente TaskCard inline para evitar dependencia circular
const TaskCard = ({ task, onEdit, onDelete, onStatusChange, compact = false }) => {
  const { PriorityBadge } = require('../shared/PriorityBadge');
  const { StatusBadge } = require('../shared/StatusBadge');
  const { Calendar, MessageSquare, Trash2, Edit2 } = require('lucide-react');
  const { users } = require('../../../data/mockData');

  const assignee = users.find(u => u.id === task.assignee);
  const initials = assignee ? `${assignee.firstName[0]}${assignee.lastName[0]}` : '?';

  return (
    <div className="card p-4 card-hover" onClick={() => onEdit(task)}>
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900 dark:text-white flex-1">{task.title}</h3>
        <div className="flex items-center gap-2 ml-2">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            className="text-gray-400 dark:text-gray-500 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <PriorityBadge priority={task.priority} />
        <StatusBadge status={task.status} />
      </div>

      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
        <div className="avatar">{initials}</div>
        {task.dueDate && (
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {task.dueDate}
          </div>
        )}
        {task.comments > 0 && (
          <div className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            {task.comments}
          </div>
        )}
      </div>

      {task.tags && task.tags.length > 0 && (
        <div className="flex items-center gap-2 mt-3">
          {task.tags.slice(0, 2).map(tag => (
            <span key={tag} className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
