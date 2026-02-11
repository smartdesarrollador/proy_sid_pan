import { createContext, useContext, useState, useEffect } from 'react';
import { users, getUserPermissions, matchPermission } from '../data/mockData';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userPermissions, setUserPermissions] = useState([]);

  // Cargar sesión desde localStorage al iniciar
  useEffect(() => {
    const storedUserId = localStorage.getItem('currentUserId');
    if (storedUserId) {
      const user = users.find(u => u.id === storedUserId);
      if (user) {
        loginUser(user);
      }
    }
  }, []);

  const loginUser = (user) => {
    const permissions = getUserPermissions(user.roles);
    setCurrentUser(user);
    setUserPermissions(permissions);
    setIsAuthenticated(true);
    localStorage.setItem('currentUserId', user.id);
  };

  const login = (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    loginUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
    setUserPermissions([]);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUserId');
  };

  const hasPermission = (permission) => {
    if (!isAuthenticated) return false;
    return matchPermission(userPermissions, permission);
  };

  const canAccess = (module) => {
    const modulePermissions = {
      dashboard: 'dashboard.read',
      users: 'users.read',
      roles: 'roles.read',
      permissions: 'permissions.read',
      subscription: 'billing.read',
      audit: 'audit.read',
      settings: 'settings.read'
    };

    const required = modulePermissions[module];
    return required ? hasPermission(required) : false;
  };

  const value = {
    currentUser,
    isAuthenticated,
    userPermissions,
    login,
    logout,
    hasPermission,
    canAccess
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
