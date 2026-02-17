import { BarChart2, TrendingUp, Users, CheckSquare, Calendar, Folder, FileText, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { tasks, events, projects, notes, auditLogs } from '../../data/mockData';
import { useFeatureGate } from '../../hooks/useFeatureGate';

const StatCard = ({ icon: Icon, label, value, color, change }) => (
  <div className="card p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        {change !== undefined && (
          <p className={`text-xs mt-1 flex items-center gap-1 ${change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            <TrendingUp className="w-3 h-3" />
            {change >= 0 ? '+' : ''}{change}% vs. mes anterior
          </p>
        )}
      </div>
      <div className={`p-2.5 rounded-xl ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </div>
);

const BarChartCSS = ({ data, title, colorClass }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="card p-5">
      <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">{title}</h3>
      <div className="space-y-2">
        {data.map(item => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="text-xs text-gray-600 dark:text-gray-400 w-24 flex-shrink-0 text-right truncate">{item.label}</span>
            <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-5 overflow-hidden">
              <div
                className={`h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500 ${colorClass}`}
                style={{ width: `${(item.value / max) * 100}%`, minWidth: item.value > 0 ? '1.5rem' : '0' }}
              >
                <span className="text-xs text-white font-medium">{item.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ReportsView = () => {
  const { t } = useTranslation('reports');
  const { hasFeature } = useFeatureGate();

  const isEnabled = hasFeature('reportsEnabled');

  if (!isEnabled) {
    return (
      <div className="text-center py-20">
        <BarChart2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('upgradeTitle')}</h3>
        <p className="text-gray-600 dark:text-gray-400">{t('upgradeDescription')}</p>
      </div>
    );
  }

  // Compute stats from mock data
  const activeTasks = tasks.filter(task => task.status !== 'done').length;
  const completedTasks = tasks.filter(task => task.status === 'done').length;
  const upcomingEvents = events.length;
  const activeProjects = projects.filter(p => p.status === 'active').length;

  // Task status distribution
  const taskStatusData = [
    { label: 'En progreso', value: tasks.filter(task => task.status === 'in_progress').length },
    { label: 'En revision', value: tasks.filter(task => task.status === 'in_review').length },
    { label: 'Pendiente', value: tasks.filter(task => task.status === 'todo').length },
    { label: 'Completado', value: tasks.filter(task => task.status === 'done').length },
  ];

  // Task priority distribution
  const taskPriorityData = [
    { label: 'Alta', value: tasks.filter(task => task.priority === 'alta').length },
    { label: 'Media', value: tasks.filter(task => task.priority === 'media').length },
    { label: 'Baja', value: tasks.filter(task => task.priority === 'baja').length },
  ];

  // Audit log actions
  const auditActionsData = [
    { label: 'assign_role', value: auditLogs.filter(l => l.action === 'assign_role').length },
    { label: 'create_role', value: auditLogs.filter(l => l.action === 'create_role').length },
    { label: 'update_user', value: auditLogs.filter(l => l.action === 'update_user').length },
    { label: 'upgrade_plan', value: auditLogs.filter(l => l.action === 'upgrade_plan').length },
    { label: 'login_failed', value: auditLogs.filter(l => l.action === 'login_failed').length },
  ].filter(d => d.value > 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
          <Activity className="w-3.5 h-3.5" />
          {t('liveData')}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={CheckSquare} label={t('stats.activeTasks')} value={activeTasks} color="bg-blue-500" change={12} />
        <StatCard icon={CheckSquare} label={t('stats.completedTasks')} value={completedTasks} color="bg-green-500" change={8} />
        <StatCard icon={Calendar} label={t('stats.upcomingEvents')} value={upcomingEvents} color="bg-purple-500" change={5} />
        <StatCard icon={Folder} label={t('stats.activeProjects')} value={activeProjects} color="bg-orange-500" change={0} />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label={t('stats.teamMembers')} value={5} color="bg-pink-500" />
        <StatCard icon={FileText} label={t('stats.notes')} value={notes.length} color="bg-yellow-500" />
        <StatCard icon={Activity} label={t('stats.auditEvents')} value={auditLogs.length} color="bg-red-500" />
        <StatCard icon={TrendingUp} label={t('stats.storageUsed')} value="12.5 GB" color="bg-cyan-500" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BarChartCSS
          data={taskStatusData}
          title={t('charts.tasksByStatus')}
          colorClass="bg-blue-500"
        />
        <BarChartCSS
          data={taskPriorityData}
          title={t('charts.tasksByPriority')}
          colorClass="bg-orange-500"
        />
        <BarChartCSS
          data={auditActionsData}
          title={t('charts.auditActions')}
          colorClass="bg-purple-500"
        />
      </div>
    </div>
  );
};
