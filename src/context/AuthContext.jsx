import { createContext, useContext, useState, useCallback } from 'react';
import { USERS } from '../data/users.js';

const AuthContext = createContext(null);

const getUsersByRole = (role) => USERS.filter((u) => u.role === role);

export function AuthProvider({ children }) {
  const employees = getUsersByRole('employee');
  const [currentUser, setCurrentUser] = useState(employees[0]);
  const [currentRole, setCurrentRole] = useState('employee');

  const switchRole = useCallback((role) => {
    const usersForRole = getUsersByRole(role);
    if (usersForRole.length > 0) {
      setCurrentUser(usersForRole[0]);
      setCurrentRole(role);
    }
  }, []);

  const value = {
    currentUser,
    currentRole,
    switchRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
