import { useState, useEffect, type ReactNode, createContext } from 'react';
import { authService, type User } from '../services/authService';
import { useStore } from '../store/useStore';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const clearAuthenticatedData = useStore((state) => state.clearAuthenticatedData);

  useEffect(() => {
    // Check if user is already logged in
    const initAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Failed to get current user:', error);
        authService.logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    setUser(response.user);
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    const response = await authService.register({ email, password, firstName, lastName });
    setUser(response.user);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    clearAuthenticatedData();
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
