import { useState } from 'react'
import { Save } from 'lucide-react'

interface ToggleProps {
  label: string
  description: string
  value: boolean
  onChange: (v: boolean) => void
}

function Toggle({ label, description, value, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-800 last:border-0">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-10 h-6 rounded-full transition-colors ${
          value ? 'bg-blue-600' : 'bg-gray-700'
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            value ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

interface InputFieldProps {
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
}

function InputField({ label, type = 'text', value, onChange }: InputFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
      />
    </div>
  )
}

export default function Settings() {
  const [company, setCompany] = useState('Acme Corporation')
  const [email, setEmail] = useState('admin@acme.com')
  const [language, setLanguage] = useState('es')
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifPush, setNotifPush] = useState(false)
  const [autoBackup, setAutoBackup] = useState(true)
  const [twoFactor, setTwoFactor] = useState(false)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Configuración</h1>
        <p className="text-gray-400">Ajustes generales de la aplicación</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <h2 className="text-base font-semibold text-white mb-4">Información general</h2>
          <div className="space-y-4">
            <InputField label="Nombre de la empresa" value={company} onChange={setCompany} />
            <InputField label="Email de contacto" type="email" value={email} onChange={setEmail} />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Idioma</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="pt">Português</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <h2 className="text-base font-semibold text-white mb-2">Notificaciones</h2>
          <Toggle
            label="Notificaciones por email"
            description="Recibir alertas y resúmenes por correo"
            value={notifEmail}
            onChange={setNotifEmail}
          />
          <Toggle
            label="Notificaciones push"
            description="Alertas en tiempo real en el escritorio"
            value={notifPush}
            onChange={setNotifPush}
          />
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <h2 className="text-base font-semibold text-white mb-2">Seguridad</h2>
          <Toggle
            label="Respaldo automático"
            description="Guardar copia de seguridad cada 24 horas"
            value={autoBackup}
            onChange={setAutoBackup}
          />
          <Toggle
            label="Autenticación de dos factores"
            description="Requerir 2FA al iniciar sesión"
            value={twoFactor}
            onChange={setTwoFactor}
          />
        </div>

        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors">
          <Save size={16} />
          Guardar cambios
        </button>
      </div>
    </div>
  )
}
