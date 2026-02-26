import { Pencil, Trash2, MessageSquare, Calendar } from "lucide-react";
import type { Task } from "../../data/mockTasks";
import { STATUS_LABELS, PRIORITY_LABELS } from "../../data/mockTasks";

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-500/20 text-gray-300",
  medium: "bg-blue-500/20 text-blue-300",
  high: "bg-orange-500/20 text-orange-300",
  urgent: "bg-red-500/20 text-red-300",
};

const STATUS_COLORS: Record<string, string> = {
  todo: "bg-gray-500/20 text-gray-300",
  in_progress: "bg-yellow-500/20 text-yellow-300",
  review: "bg-purple-500/20 text-purple-300",
  done: "bg-green-500/20 text-green-300",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate();
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${day} ${months[date.getMonth()]}`;
}

interface TaskCardProps {
  task: Task;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;

  return (
    <div className="group rounded-lg border border-gray-700 bg-[#1a1a2e] p-3 transition-colors hover:border-gray-600">
      {/* Title + hover actions */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium leading-snug text-gray-200">
          {task.title}
        </h3>
        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onEdit(task.id)}
            className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="rounded p-1 text-gray-400 hover:bg-red-900/50 hover:text-red-300"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Badges */}
      <div className="mb-2 flex flex-wrap gap-1">
        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_COLORS[task.status]}`}>
          {STATUS_LABELS[task.status]}
        </span>
        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
          {PRIORITY_LABELS[task.priority]}
        </span>
      </div>

      {/* Subtask progress */}
      {totalSubtasks > 0 && (
        <div className="mb-2">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {completedSubtasks}/{totalSubtasks} subtareas
            </span>
          </div>
          <div className="h-1 rounded-full bg-gray-700">
            <div
              className="h-1 rounded-full bg-blue-500 transition-all"
              style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Metadata row */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <div
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-[10px] font-medium text-blue-300"
          title={task.assignee}
        >
          {getInitials(task.assignee)}
        </div>
        <div className="flex items-center gap-1">
          <Calendar size={11} />
          <span>{formatDate(task.dueDate)}</span>
        </div>
        {task.comments > 0 && (
          <div className="flex items-center gap-1">
            <MessageSquare size={11} />
            <span>{task.comments}</span>
          </div>
        )}
      </div>
    </div>
  );
}
