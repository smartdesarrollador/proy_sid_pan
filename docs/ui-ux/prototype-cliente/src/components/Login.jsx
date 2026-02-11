import { useState } from 'react';
import { users } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, CheckSquare, ChevronRight, User } from 'lucide-react';

function Login() {
  const { login } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);

  const handleLogin = (userId) => {
    login(userId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center p-8">
      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-primary-600 rounded-xl p-3">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Portal de Cliente</h1>
          </div>
          <p className="text-lg text-gray-600">
            Gestiona tus tareas, calendario y proyectos en un solo lugar
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <CheckSquare className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Gestión de Tareas</h3>
            <p className="text-sm text-gray-600">Organiza y prioriza tu trabajo</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Calendario</h3>
            <p className="text-sm text-gray-600">Visualiza eventos y reuniones</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <User className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Dashboard Personal</h3>
            <p className="text-sm text-gray-600">Vista general de tu actividad</p>
          </div>
        </div>

        {/* Login Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Iniciar Sesión</h2>
          <p className="text-sm text-gray-600 mb-6">Selecciona tu usuario para acceder al portal</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.filter(u => u.status === 'active').map((user) => {
              const isSelected = selectedUser?.id === user.id;

              return (
                <div
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  onDoubleClick={() => handleLogin(user.id)}
                  className={`
                    border-2 rounded-lg p-4 cursor-pointer transition-all
                    ${isSelected
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
                      {user.firstName[0]}{user.lastName[0]}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>

                  {isSelected && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLogin(user.id);
                      }}
                      className="w-full bg-primary-600 text-white font-medium py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                    >
                      Acceder
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-sm text-gray-500 mt-4 text-center">
            💡 Tip: Haz doble click en un usuario para acceso rápido
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Prototipo de demostración - Los datos son simulados</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
