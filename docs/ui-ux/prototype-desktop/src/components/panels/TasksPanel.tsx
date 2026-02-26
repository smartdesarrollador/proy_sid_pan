import { useState, useMemo } from "react";
import { Search, Filter, Plus, CheckSquare } from "lucide-react";
import { MOCK_TASKS, STATUS_LABELS, PRIORITY_LABELS } from "../../data/mockTasks";
import type { TaskStatus, TaskPriority } from "../../data/mockTasks";
import TaskCard from "../tasks/TaskCard";

export default function TasksPanel() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) + (priorityFilter !== "all" ? 1 : 0);

  const filteredTasks = useMemo(() => {
    return MOCK_TASKS.filter((task) => {
      if (search && !task.title.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (statusFilter !== "all" && task.status !== statusFilter) return false;
      if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
      return true;
    });
  }, [search, statusFilter, priorityFilter]);

  const activeTasks = MOCK_TASKS.filter((t) => t.status !== "done").length;

  const handleEdit = (id: string) => {
    console.log("Edit task:", id);
  };

  const handleDelete = (id: string) => {
    console.log("Delete task:", id);
  };

  const handleNewTask = () => {
    console.log("New task");
  };

  return (
    <div className="flex h-full flex-col p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-200">Tareas</h2>
        <span className="text-xs text-gray-400">{activeTasks} activas</span>
      </div>

      {/* Search */}
      <div className="relative mb-2">
        <Search
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500"
        />
        <input
          type="text"
          placeholder="Buscar tareas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-gray-700 bg-[#1a1a2e] py-1.5 pl-8 pr-3 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500/50"
        />
      </div>

      {/* Filter toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="mb-2 flex w-full items-center gap-2 rounded-md border border-gray-700 bg-[#1a1a2e] px-3 py-1.5 text-sm text-gray-400 transition-colors hover:border-gray-600 hover:text-gray-200"
      >
        <Filter size={14} />
        <span>Filtros</span>
        {activeFilterCount > 0 && (
          <span className="ml-auto rounded-full bg-blue-500/20 px-1.5 py-0.5 text-xs font-medium text-blue-300">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Collapsible filters */}
      {showFilters && (
        <div className="mb-2 flex flex-col gap-2 rounded-md border border-gray-700 bg-[#1a1a2e] p-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "all")}
            className="w-full rounded border border-gray-700 bg-[#13131f] px-2 py-1.5 text-sm text-gray-200 outline-none focus:border-blue-500/50"
          >
            <option value="all">Todos los estados</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | "all")}
            className="w-full rounded border border-gray-700 bg-[#13131f] px-2 py-1.5 text-sm text-gray-200 outline-none focus:border-blue-500/50"
          >
            <option value="all">Todas las prioridades</option>
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* New task button */}
      <button
        onClick={handleNewTask}
        className="mb-3 flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
      >
        <Plus size={14} />
        Nueva Tarea
      </button>

      {/* Task list */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <CheckSquare size={32} className="mb-2" />
            <p className="text-sm">No se encontraron tareas</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-2 border-t border-gray-700 pt-2 text-center text-xs text-gray-500">
        Mostrando {filteredTasks.length} de {MOCK_TASKS.length}
      </div>
    </div>
  );
}
