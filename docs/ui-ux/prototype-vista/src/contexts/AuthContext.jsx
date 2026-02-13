import { createContext, useContext, useState, useEffect } from 'react';
import { getUserById } from '../data/mockData';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('currentUserId');
    if (storedUserId) {
      const user = getUserById(storedUserId);
      if (user && user.status === 'active') {
        setCurrentUser(user);
        setIsAuthenticated(true);
        setCurrentPlan(user.plan);
      } else {
        // Invalid or inactive user, clear storage
        localStorage.removeItem('currentUserId');
      }
    }
    setIsLoading(false);
  }, []);

  // Login method
  const login = (userId) => {
    const user = getUserById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    if (user.status !== 'active') {
      throw new Error('Usuario no activo. Por favor, contacta a soporte.');
    }

    setCurrentUser(user);
    setIsAuthenticated(true);
    setCurrentPlan(user.plan);
    localStorage.setItem('currentUserId', user.id);
  };

  // Logout method
  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setCurrentPlan('free');
    localStorage.removeItem('currentUserId');
  };

  const value = {
    currentUser,
    isAuthenticated,
    currentPlan,
    isLoading,
    login,
    logout,
    setCurrentPlan, // Keep for demo plan switching (optional)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
