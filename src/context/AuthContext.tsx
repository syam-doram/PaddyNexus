import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Role = 'machine_harvest' | 'paddy_harvest' | 'trader' | null;

export interface User {
  id: string;
  name: string;
  mobile: string;
  location: string;
  role: Role;
  trader_id?: number | null;
  commission_rate?: number;
  password?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const savedUserStr = localStorage.getItem('app_user');
    if (savedUserStr) {
      try {
        const savedUser = JSON.parse(savedUserStr) as User;
        setUser(savedUser);
      } catch (e) {
        console.error("Failed to parse user from local storage", e);
      }
    }
    setLoading(false);
  }, []);

  const login = (newUser: User) => {
    if (newUser && newUser.role) {
      localStorage.setItem('app_user', JSON.stringify(newUser));
      setUser(newUser);
    }
  };

  const logout = () => {
    localStorage.removeItem('app_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
