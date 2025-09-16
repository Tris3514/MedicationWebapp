/**
 * Custom hook for managing user-specific data
 */

import { useAuth } from '@/contexts/AuthContext';
import { getUserData, saveUserData, saveUserDataDebounced, saveUserDataImmediate, UserData } from '@/utils/userDataManager';
import { useCallback } from 'react';

export function useUserData() {
  const { user, isAuthenticated } = useAuth();

  const getCurrentUserData = useCallback((): UserData | null => {
    if (!isAuthenticated || !user?.id) {
      return null;
    }
    return getUserData(user.id);
  }, [isAuthenticated, user?.id]);

  const saveData = useCallback((data: Partial<UserData>) => {
    if (!isAuthenticated || !user?.id) {
      console.warn('Cannot save data: user not authenticated');
      return;
    }

    const currentData = getUserData(user.id);
    const updatedData = { ...currentData, ...data };
    saveUserDataDebounced(user.id, updatedData);
  }, [isAuthenticated, user?.id]);

  const getData = useCallback(<K extends keyof UserData>(key: K): UserData[K] | null => {
    if (!isAuthenticated || !user?.id) {
      return null;
    }

    const userData = getUserData(user.id);
    return userData[key] || null;
  }, [isAuthenticated, user?.id]);

  const setData = useCallback(<K extends keyof UserData>(key: K, value: UserData[K]) => {
    if (!isAuthenticated || !user?.id) {
      console.warn('Cannot set data: user not authenticated');
      return;
    }

    const currentData = getUserData(user.id);
    const updatedData = { ...currentData, [key]: value };
    saveUserDataDebounced(user.id, updatedData);
  }, [isAuthenticated, user?.id]);

  const saveDataImmediate = useCallback((data: Partial<UserData>) => {
    if (!isAuthenticated || !user?.id) {
      console.warn('Cannot save data: user not authenticated');
      return;
    }

    const currentData = getUserData(user.id);
    const updatedData = { ...currentData, ...data };
    saveUserDataImmediate(user.id, updatedData);
  }, [isAuthenticated, user?.id]);

  const setDataImmediate = useCallback(<K extends keyof UserData>(key: K, value: UserData[K]) => {
    if (!isAuthenticated || !user?.id) {
      console.warn('Cannot set data: user not authenticated');
      return;
    }

    const currentData = getUserData(user.id);
    const updatedData = { ...currentData, [key]: value };
    saveUserDataImmediate(user.id, updatedData);
  }, [isAuthenticated, user?.id]);

  return {
    isAuthenticated,
    user,
    getCurrentUserData,
    saveData,
    getData,
    setData,
    saveDataImmediate,
    setDataImmediate,
  };
}
