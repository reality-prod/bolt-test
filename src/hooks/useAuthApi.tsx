import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { authApi, tokenManager, User } from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, displayName?: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = tokenManager.get();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    const { data, error } = await authApi.me();
    if (error || !data) {
      tokenManager.remove();
      setUser(null);
    } else {
      setUser(data.user);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const signUp = async (email: string, password: string, username: string, displayName?: string) => {
    const { data, error } = await authApi.register(email, username, password, displayName);
    if (error) return { error };
    if (data) {
      tokenManager.set(data.token);
      setUser(data.user);
    }
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await authApi.login(email, password);
    if (error) return { error };
    if (data) {
      tokenManager.set(data.token);
      setUser(data.user);
    }
    return { error: null };
  };

  const signOut = () => {
    tokenManager.remove();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, refreshUser }}>
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
