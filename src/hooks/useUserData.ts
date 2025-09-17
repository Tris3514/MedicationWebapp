/**
 * Custom hook for managing user-specific data
 * Now uses the global UserDataContext for centralized data management
 */

import { useAuth } from '@/contexts/AuthContext';
import { useUserDataContext } from '@/contexts/UserDataContext';
import { UserData } from '@/utils/userDataManager';

export function useUserData() {
  const { user, isAuthenticated } = useAuth();
  const { userData, updateData, updateMultipleData, getData, saveData } = useUserDataContext();

  // Legacy compatibility methods
  const getCurrentUserData = (): UserData | null => {
    return userData;
  };

  const saveDataLegacy = (data: Partial<UserData>) => {
    updateMultipleData(data);
  };

  const setData = <K extends keyof UserData>(key: K, value: UserData[K]) => {
    updateData(key, value);
  };

  const saveDataImmediate = (data: Partial<UserData>) => {
    updateMultipleData(data);
  };

  const setDataImmediate = <K extends keyof UserData>(key: K, value: UserData[K]) => {
    updateData(key, value);
  };

  return {
    isAuthenticated,
    user,
    userData,
    getCurrentUserData,
    saveData: saveDataLegacy,
    getData,
    setData,
    saveDataImmediate,
    setDataImmediate,
  };
}
