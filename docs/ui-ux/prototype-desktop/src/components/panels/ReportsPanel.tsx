import {
  CheckSquare,
  Calendar,
  Folder,
  FileText,
  Users,
  Activity,
  TrendingUp,
  BarChart2,
} from "lucide-react";
import {
  STAT_CARDS,
  TASKS_BY_STATUS,
  TASKS_BY_PRIORITY,
  AUDIT_ACTIONS,
} from "../../data/mockReports";
import type { StatItem, ChartData } from "../../data/mockReports";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  CheckSquare,
  Calendar,
  Folder,
  FileText,
  Users,
  Activity,
  TrendingUp,
  BarChart2,
};

function StatCard({ stat }: { stat: StatItem }) {
  const Icon = ICON_MAP[stat.icon] || Activity;

  return (
    <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] p-3">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-gray-400">{stat.label}</p>
          <p className="mt-0.5 text-lg font-bold text-gray-100">{stat.value}</p>
          {stat.change !== undefined && (
            <p
              className={`mt-0.5 flex items-center gap-1 text-[10px] ${
                stat.change >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              <TrendingUp size={10} />
              {stat.change >= 0 ? "+" : ""}
              {stat.change}% vs. mes anterior
            </p>
          )}
        </div>
        <div className={`ml-2 flex-shrink-0 rounded-lg p-1.5 ${stat.color}`}>
          <Icon size={14} className="text-white" />
        </div>
      </div>
    </div>
  );
}

function BarChart({ chart }: { chart: ChartData }) {
  const max = Math.max(...chart.items.map((d) => d.value), 1);

  return (
    <div className="rounded-lg border border-gray-700/50 bg-[#1a1a2e] p-3">
      <h3 className="mb-3 text-sm font-semibold text-gray-200">{chart.title}</h3>
      <div className="space-y-2">
        {chart.items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="w-20 flex-shrink-0 truncate text-right text-[11px] text-gray-400">
              {item.label}
            </span>
            <div className="h-4 flex-1 overflow-hidden rounded-full bg-gray-700">
              <div
                className={`flex h-full items-center justify-end rounded-full pr-1.5 transition-all duration-500 ${chart.colorClass}`}
                style={{
                  width: `${(item.value / max) * 100}%`,
                  minWidth: item.value > 0 ? "1.5rem" : "0",
                }}
              >
                <span className="text-[10px] font-medium text-white">{item.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReportsPanel() {
  return (
    <div className="flex h-full flex-col p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-200">Reportes</h2>
        <div className="flex items-center gap-1.5 rounded-md bg-green-500/15 px-2 py-1 text-[11px] text-green-400">
          <Activity size={12} />
          En vivo
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {/* Stat cards grid */}
        <div className="grid grid-cols-2 gap-2">
          {STAT_CARDS.map((stat) => (
            <StatCard key={stat.id} stat={stat} />
          ))}
        </div>

        {/* Charts */}
        <BarChart chart={TASKS_BY_STATUS} />
        <BarChart chart={TASKS_BY_PRIORITY} />
        <BarChart chart={AUDIT_ACTIONS} />
      </div>
    </div>
  );
}
