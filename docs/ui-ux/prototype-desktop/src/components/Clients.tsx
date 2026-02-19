import { Search, Plus } from 'lucide-react'

interface Client {
  id: number
  name: string
  email: string
  plan: 'Free' | 'Pro' | 'Enterprise'
  status: 'Activo' | 'Inactivo' | 'Pendiente'
  joined: string
}

const clients: Client[] = [
  { id: 1, name: 'Acme Corp', email: 'admin@acme.com', plan: 'Enterprise', status: 'Activo', joined: '12 Ene 2025' },
  { id: 2, name: 'TechStart SRL', email: 'hola@techstart.io', plan: 'Pro', status: 'Activo', joined: '28 Ene 2025' },
  { id: 3, name: 'Soluciones MX', email: 'contacto@solmx.com', plan: 'Free', status: 'Pendiente', joined: '03 Feb 2025' },
  { id: 4, name: 'DataFlow Inc', email: 'ops@dataflow.co', plan: 'Pro', status: 'Activo', joined: '15 Feb 2025' },
  { id: 5, name: 'Nexo Digital', email: 'info@nexodigital.net', plan: 'Enterprise', status: 'Activo', joined: '22 Feb 2025' },
  { id: 6, name: 'CloudBase SA', email: 'admin@cloudbase.io', plan: 'Free', status: 'Inactivo', joined: '01 Mar 2025' },
]

const planColors: Record<Client['plan'], string> = {
  Free: 'bg-gray-700 text-gray-300',
  Pro: 'bg-blue-600/20 text-blue-300',
  Enterprise: 'bg-purple-600/20 text-purple-300',
}

const statusColors: Record<Client['status'], string> = {
  Activo: 'bg-green-600/20 text-green-300',
  Inactivo: 'bg-red-600/20 text-red-300',
  Pendiente: 'bg-yellow-600/20 text-yellow-300',
}

export default function Clients() {
  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Clientes</h1>
          <p className="text-gray-400">Gestión de cuentas y contratos</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          <Plus size={16} />
          Nuevo cliente
        </button>
      </div>

      <div className="bg-gray-900 rounded-2xl border border-gray-800">
        <div className="p-4 border-b border-gray-800">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar clientes..."
              className="w-full bg-gray-800 text-white placeholder-gray-500 rounded-lg pl-9 pr-4 py-2 text-sm border border-gray-700 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Empresa</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Email</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Plan</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Estado</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Alta</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                        <span className="text-xs text-gray-300 font-semibold">
                          {client.name.charAt(0)}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-white">{client.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">{client.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${planColors[client.plan]}`}>
                      {client.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[client.status]}`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">{client.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
