import { Mail, MapPin, Calendar, Shield, Edit } from 'lucide-react'

interface StatProps {
  label: string
  value: string
}

function Stat({ label, value }: StatProps) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

const recentActions = [
  { action: 'Actualizó plan de Acme Corp', time: 'hace 2h', type: 'update' },
  { action: 'Resolvió ticket #1204', time: 'hace 5h', type: 'resolve' },
  { action: 'Creó reporte mensual', time: 'hace 1d', type: 'create' },
  { action: 'Añadió usuario María García', time: 'hace 2d', type: 'create' },
  { action: 'Actualizó configuración de seguridad', time: 'hace 3d', type: 'update' },
]

const typeColors: Record<string, string> = {
  update: 'bg-blue-600/20 text-blue-300',
  resolve: 'bg-green-600/20 text-green-300',
  create: 'bg-purple-600/20 text-purple-300',
}

export default function Profile() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Perfil</h1>
        <p className="text-gray-400">Tu información y actividad reciente</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <span className="text-2xl font-bold text-white">JD</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Juan Díaz</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Shield size={12} className="text-blue-400" />
                  <span className="text-sm text-blue-400">Administrador</span>
                </div>
              </div>
            </div>
            <button className="flex items-center gap-1.5 text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg text-sm transition-colors">
              <Edit size={14} />
              Editar
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 py-4 border-y border-gray-800 mb-6">
            <Stat label="Proyectos" value="24" />
            <Stat label="Clientes" value="6" />
            <Stat label="Tickets" value="142" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <Mail size={14} className="text-gray-600" />
              <span>juan.diaz@empresa.com</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <MapPin size={14} className="text-gray-600" />
              <span>Ciudad de México, México</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <Calendar size={14} className="text-gray-600" />
              <span>Miembro desde Enero 2024</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <h3 className="text-base font-semibold text-white mb-4">Actividad Reciente</h3>
          <div className="space-y-3">
            {recentActions.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[item.type]}`}>
                    {item.type === 'update' ? 'Actualización' : item.type === 'resolve' ? 'Resolución' : 'Creación'}
                  </span>
                  <span className="text-sm text-gray-300">{item.action}</span>
                </div>
                <span className="text-xs text-gray-500 ml-4 shrink-0">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
