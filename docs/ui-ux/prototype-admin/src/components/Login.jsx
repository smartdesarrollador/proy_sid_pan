import { useState } from 'react';
import { users, rolePermissions } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { Shield, ChevronRight, CheckCircle2 } from 'lucide-react';

function Login() {
  const { login } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);

  const handleLogin = (userId) => {
    login(userId);
  };

  const getRoleColor = (roleName) => {
    const colors = {
      'OrgAdmin': 'bg-red-100 text-red-700 border-red-200',
      'Manager': 'bg-orange-100 text-orange-700 border-orange-200',
      'Member': 'bg-blue-100 text-blue-700 border-blue-200',
      'Guest': 'bg-gray-100 text-gray-700 border-gray-200',
      'Content Editor': 'bg-purple-100 text-purple-700 border-purple-200',
      'HR Access': 'bg-green-100 text-green-700 border-green-200',
      'Engineering': 'bg-yellow-100 text-yellow-700 border-yellow-200'
    };
    return colors[roleName] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getUserPermissionCount = (userRoles) => {
    const allPerms = new Set();
    userRoles.forEach(role => {
      const perms = rolePermissions[role] || [];
      perms.forEach(p => allPerms.add(p));
    });
    return allPerms.size;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center p-8">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-primary-600 rounded-xl p-3">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">RBAC Prototype</h1>
          </div>
          <p className="text-lg text-gray-600">
            Selecciona un usuario para simular el login y explorar el sistema según su rol
          </p>
        </div>

        {/* User Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => {
            const isSelected = selectedUser?.id === user.id;
            const permCount = getUserPermissionCount(user.roles);

            return (
              <div
                key={user.id}
                onClick={() => setSelectedUser(user)}
                onDoubleClick={() => handleLogin(user.id)}
                className={`
                  bg-white rounded-xl border-2 p-6 cursor-pointer transition-all transform hover:scale-105
                  ${isSelected
                    ? 'border-primary-500 shadow-xl shadow-primary-100'
                    : 'border-gray-200 hover:border-primary-300 hover:shadow-lg'
                  }
                `}
              >
                {/* Avatar */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xl font-bold">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {user.firstName} {user.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>

                {/* Roles */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {user.roles.map((role) => (
                      <span
                        key={role}
                        className={`
                          text-xs font-medium px-2.5 py-1 rounded-lg border
                          ${getRoleColor(role)}
                        `}
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Permissions Count */}
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-gray-600">Permisos:</span>
                  <span className="font-semibold text-primary-600">{permCount}</span>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {user.status === 'active' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-green-600 font-medium">Activo</span>
                      </>
                    ) : (
                      <span className="text-xs text-yellow-600 font-medium">Pendiente</span>
                    )}
                  </div>
                  {user.mfaEnabled && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      MFA
                    </span>
                  )}
                </div>

                {/* Login Button */}
                {isSelected && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLogin(user.id);
                    }}
                    className="w-full mt-4 bg-primary-600 text-white font-medium py-2.5 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                  >
                    Login como {user.firstName}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected User Info */}
        {selectedUser && (
          <div className="mt-8 bg-white rounded-xl border border-primary-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              Permisos de {selectedUser.firstName}:
            </h3>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(
                selectedUser.roles.flatMap(role => rolePermissions[role] || [])
              )).map((perm) => (
                <span
                  key={perm}
                  className="text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-lg border border-primary-200"
                >
                  {perm}
                </span>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-4">
              💡 Tip: Haz doble click en una tarjeta para login rápido
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Sistema de demostración - Los datos son simulados</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
