import { createContext, useContext, useState, ReactNode } from 'react';
import { apiClient } from '../api/client';
import { User } from '../types';

interface AuthContextValue {
  user: User | null;

  login: (
    email: string,
    password: string
  ) => Promise<void>;

  register: (
    name: string,
    email: string,
    password: string,
    role: string
  ) => Promise<void>;

  logout: () => void;

  isLoading: boolean;
}

const AuthContext =
  createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');

    return stored ? JSON.parse(stored) : null;
  });

  const [isLoading, setIsLoading] = useState(false);

  async function login(
    email: string,
    password: string
  ) {
    setIsLoading(true);

    try {
      const res = await apiClient.post('/auth/login', {
        email,
        password,
      });

      const {
        token,
        user: loggedInUser,
      } = res.data.data;

      localStorage.setItem('token', token);
      localStorage.setItem(
        'user',
        JSON.stringify(loggedInUser)
      );

      setUser(loggedInUser);
    } finally {
      setIsLoading(false);
    }
  }

  async function register(
    name: string,
    email: string,
    password: string,
    role: string
  ) {
    setIsLoading(true);

    try {
      // Public self-signup route -- role is capped server-side to
      // non-admin values regardless of what's sent here.
      await apiClient.post('/auth/signup', {
        name,
        email,
        password,
        role,
      });
    } finally {
      setIsLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      'useAuth must be used within AuthProvider'
    );
  }

  return ctx;
}
