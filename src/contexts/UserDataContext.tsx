"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getUserData, saveUserData, saveUserDataImmediate, getDefaultUserData, UserData } from '@/utils/userDataManager';

interface UserDataContextType {
  userData: UserData | null;
  isLoading: boolean;
  updateData: <K extends keyof UserData>(key: K, value: UserData[K]) => void;
  updateMultipleData: (data: Partial<UserData>) => void;
  getData: <K extends keyof UserData>(key: K) => UserData[K] | null;
  saveData: () => void;
  resetToDefaults: () => void;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

interface UserDataProviderProps {
  children: ReactNode;
}

export function UserDataProvider({ children }: UserDataProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load all user data when user logs in
  const loadUserData = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setUserData(null);
      return;
    }

    setIsLoading(true);
    try {
      console.log('Loading user data for user:', user.id);
      const data = getUserData(user.id);
      setUserData(data);
      console.log('Loaded user data:', data);
    } catch (error) {
      console.error('Failed to load user data:', error);
      setUserData(getDefaultUserData());
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Reset to default data (for logout)
  const resetToDefaults = useCallback(() => {
    console.log('Resetting user data to defaults');
    setUserData(null);
  }, []);

  // Update a single data field
  const updateData = useCallback(<K extends keyof UserData>(key: K, value: UserData[K]) => {
    if (!isAuthenticated || !user?.id || !userData) {
      console.warn('Cannot update data: user not authenticated or data not loaded');
      return;
    }

    const updatedData = { ...userData, [key]: value };
    setUserData(updatedData);
    
    // Save immediately
    console.log(`Updating ${key}:`, value);
    saveUserDataImmediate(user.id, updatedData);
  }, [isAuthenticated, user?.id, userData]);

  // Update multiple data fields at once
  const updateMultipleData = useCallback((data: Partial<UserData>) => {
    if (!isAuthenticated || !user?.id || !userData) {
      console.warn('Cannot update data: user not authenticated or data not loaded');
      return;
    }

    const updatedData = { ...userData, ...data };
    setUserData(updatedData);
    
    // Save immediately
    console.log('Updating multiple data fields:', data);
    saveUserDataImmediate(user.id, updatedData);
  }, [isAuthenticated, user?.id, userData]);

  // Get a specific data field
  const getData = useCallback(<K extends keyof UserData>(key: K): UserData[K] | null => {
    if (!userData) return null;
    return userData[key] || null;
  }, [userData]);

  // Force save current data
  const saveData = useCallback(() => {
    if (!isAuthenticated || !user?.id || !userData) {
      console.warn('Cannot save data: user not authenticated or data not loaded');
      return;
    }

    console.log('Force saving user data:', userData);
    saveUserDataImmediate(user.id, userData);
  }, [isAuthenticated, user?.id, userData]);

  // Load data when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      loadUserData();
    } else {
      // Reset to defaults when user logs out
      resetToDefaults();
    }
  }, [isAuthenticated, loadUserData, resetToDefaults]);

  const value: UserDataContextType = {
    userData,
    isLoading,
    updateData,
    updateMultipleData,
    getData,
    saveData,
    resetToDefaults,
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
}

export function useUserDataContext() {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserDataContext must be used within a UserDataProvider');
  }
  return context;
}
