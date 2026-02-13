import { Eye, MousePointerClick, QrCode, Download } from 'lucide-react';
import { getAnalyticsByService } from '../../data/mockData';
import { useAuth } from '../../contexts/AuthContext';

const StatCard = ({ icon: Icon, label, value, change, color }) => {
  return (
    <div className="card card-body">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change && (
          <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
        {value.toLocaleString()}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
    </div>
  );
};

const SimpleChart = ({ data, label }) => {
  const maxValue = Math.max(...data.map(d => d.views));

  return (
    <div className="card card-body">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">
        {label}
      </h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">
                {new Date(item.date).toLocaleDateString('es-ES', {
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {item.views} visitas
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all"
                style={{ width: `${(item.views / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TopReferrers = ({ referrers }) => {
  return (
    <div className="card card-body">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">
        Principales Fuentes de Tráfico
      </h3>
      <div className="space-y-4">
        {referrers.map((referrer, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm">
                {index + 1}
              </div>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {referrer.source}
              </span>
            </div>
            <span className="text-gray-600 dark:text-gray-400">
              {referrer.visits} visitas
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AnalyticsPanel = ({ cardData }) => {
  const { currentUser } = useAuth();
  const analytics = getAnalyticsByService(currentUser.id, 'digitalCard');

  if (!analytics) {
    return (
      <div className="card card-body">
        <p className="text-gray-600 dark:text-gray-400">
          No hay datos de estadísticas disponibles.
        </p>
      </div>
    );
  }

  const totalViews = analytics.last7Days.reduce((sum, day) => sum + day.views, 0);
  const totalClicks = analytics.last7Days.reduce((sum, day) => sum + day.clicks, 0);
  const totalScans = analytics.last7Days.reduce((sum, day) => sum + day.qrScans, 0);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Eye}
          label="Vistas Totales"
          value={cardData.stats.views}
          change={12}
          color="bg-blue-500"
        />
        <StatCard
          icon={MousePointerClick}
          label="Clics en Enlaces"
          value={cardData.stats.clicks}
          change={8}
          color="bg-green-500"
        />
        <StatCard
          icon={QrCode}
          label="Escaneos QR"
          value={cardData.stats.qrScans}
          change={-3}
          color="bg-purple-500"
        />
        <StatCard
          icon={Download}
          label="Descargas vCard"
          value={cardData.stats.vCardDownloads}
          change={15}
          color="bg-orange-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleChart
          data={analytics.last7Days}
          label="Vistas de los Últimos 7 Días"
        />
        <TopReferrers referrers={analytics.topReferrers} />
      </div>

      {/* Summary */}
      <div className="card card-body">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
          Resumen Semanal
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Total Vistas (7 días)
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {totalViews}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Total Clics (7 días)
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {totalClicks}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Total Escaneos (7 días)
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {totalScans}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
