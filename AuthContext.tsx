import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../index'; // Adjust path
import { QueueService } from '../api/queueService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (
    username: string,
    password: string,
    email: string,
    type: 'patient' | 'admin',
    phoneNumber?: string,
    gender?: 'male' | 'female' | 'other',
    age?: number,
    diseases?: string[],
    employeeId?: string,
    staffDepartment?: string
  ) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isPatient: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Error parsing stored user:', err);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const authenticatedUser = await QueueService.login(username, password);
      if (authenticatedUser) {
        setUser(authenticatedUser);
        localStorage.setItem('user', JSON.stringify(authenticatedUser));
        return true;
      } else {
        setError('Invalid username or password');
        return false;
      }
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error('Login error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (
    username: string,
    password: string,
    email: string,
    type: 'patient' | 'admin',
    phoneNumber?: string,
    gender?: 'male' | 'female' | 'other',
    age?: number,
    diseases?: string[],
    employeeId?: string,
    staffDepartment?: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const newUser = await QueueService.signup(
        username,
        password,
        email,
        type,
        phoneNumber,
        gender,
        age,
        diseases,
        employeeId,
        staffDepartment
      );
      if (newUser) {
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
        return true;
      } else {
        setError('Signup failed. Please try again.');
        return false;
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('exists')) {
        setError('Username or email already exists');
      } else {
        setError('Signup failed. Please try again.');
      }
      console.error('Signup error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isPatient: user?.role === 'patient'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};