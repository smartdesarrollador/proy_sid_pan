import { Calendar, MessageSquare, Trash2, Edit2, Share2 } from 'lucide-react';
import { PriorityBadge } from '../shared/PriorityBadge';
import { StatusBadge } from '../shared/StatusBadge';
import { users } from '../../data/mockData';
import ShareButton from '../sharing/ShareButton';

export const TaskCard = ({ task, onEdit, onDelete, onStatusChange, compact = false }) => {
  const assignee = users.find(u => u.id === task.assignee);
  const initials = assignee ? `${assignee.firstName[0]}${assignee.lastName[0]}` : '?';

  return (
    <div className="card p-4 card-hover" onClick={() => onEdit(task)}>
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900 dark:text-white flex-1">{task.title}</h3>
        <div className="flex items-center gap-2 ml-2" onClick={(e) => e.stopPropagation()}>
          <div onClick={(e) => e.stopPropagation()}>
            <ShareButton
              resourceType="task"
              resourceId={task.id}
              resourceName={task.title}
              size="sm"
              variant="ghost"
              currentPlan="professional"
              showCounter={false}
            />
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 p-1"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 p-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!compact && task.description && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{task.description}</p>
      )}

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
          {task.tags.length > 2 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">+{task.tags.length - 2} más</span>
          )}
        </div>
      )}
    </div>
  );
};
