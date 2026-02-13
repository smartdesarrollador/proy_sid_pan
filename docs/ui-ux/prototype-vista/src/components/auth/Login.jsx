import { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { users } from '../../data/mockData';
import { useAuth } from '../../contexts/AuthContext';
import { LoginUserCard } from './LoginUserCard';

export const Login = ({ onBack }) => {
  const { login } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState(null);

  // Filter only active users
  const activeUsers = users.filter(user => user.status === 'active');

  const handleLogin = (userId) => {
    try {
      setError(null);
      login(userId);
      // After successful login, App.jsx will detect isAuthenticated and navigate
    } catch (err) {
      setError(err.message);
      console.error('Error al iniciar sesión:', err);
    }
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
  };

  const handleUserDoubleClick = (user) => {
    handleLogin(user.id);
  };

  const handleAccederClick = () => {
    if (selectedUser) {
      handleLogin(selectedUser.id);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Vista Digital
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Selecciona un usuario para continuar
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400 text-center">
              {error}
            </p>
          </div>
        )}

        {/* User Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {activeUsers.map(user => (
            <LoginUserCard
              key={user.id}
              user={user}
              isSelected={selectedUser?.id === user.id}
              onClick={() => handleUserClick(user)}
              onDoubleClick={() => handleUserDoubleClick(user)}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-4">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Volver
          </button>

          {/* Login Button - only shown when user is selected */}
          {selectedUser && (
            <button
              onClick={handleAccederClick}
              className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              Acceder como {selectedUser.name}
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Hint */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          💡 Tip: Haz doble clic en una tarjeta para acceder directamente
        </p>
      </div>
    </div>
  );
};
