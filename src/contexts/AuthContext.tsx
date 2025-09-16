"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState, LoginCredentials, SignUpCredentials, AuthResponse } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  signUp: (credentials: SignUpCredentials) => Promise<AuthResponse>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const userData = localStorage.getItem('user_data');
        if (userData) {
          const user = JSON.parse(userData);
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('user_data');
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Failed to load user data',
        });
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check if user exists in localStorage
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const user = existingUsers.find((u: any) => 
        u.email === credentials.email && u.password === credentials.password
      );

      if (user) {
        // Update last login
        const updatedUser = {
          ...user,
          lastLoginAt: new Date().toISOString(),
        };
        
        // Update user in storage
        const updatedUsers = existingUsers.map((u: any) => 
          u.email === user.email ? updatedUser : u
        );
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
        
        setAuthState({
          user: updatedUser,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        return { success: true, user: updatedUser };
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Invalid email or password',
        }));
        return { success: false, error: 'Invalid email or password' };
      }
    } catch (error) {
      const errorMessage = 'Login failed. Please try again.';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  };

  const signUp = async (credentials: SignUpCredentials): Promise<AuthResponse> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check if user already exists
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const existingUser = existingUsers.find((u: any) => u.email === credentials.email);

      if (existingUser) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: 'User with this email already exists',
        }));
        return { success: false, error: 'User with this email already exists' };
      }

      // Create new user
      const newUser = {
        id: Date.now().toString(),
        name: credentials.name,
        email: credentials.email,
        password: credentials.password, // In a real app, this would be hashed
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      // Save user to localStorage
      const updatedUsers = [...existingUsers, newUser];
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      localStorage.setItem('user_data', JSON.stringify(newUser));
      
      setAuthState({
        user: newUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true, user: newUser };
    } catch (error) {
      const errorMessage = 'Sign up failed. Please try again.';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('user_data');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  };

  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  const value: AuthContextType = {
    ...authState,
    login,
    signUp,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
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
