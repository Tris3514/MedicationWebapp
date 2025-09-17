/**
 * User Data Manager - Handles user-specific data storage and retrieval
 */

export interface UserData {
  // Flight Tracker Data
  flightCount: number;
  trackedFlightIds: string[];
  
  // Weather Tracker Data
  weatherLocations: any[];
  
  // Business Scraper Data
  savedBusinesses: any[];
  blacklistedBusinesses: any[];
  
  // Medication Tracker Data
  medications: any[];
  lastCheckDate: string | null;
  
  // Network Speed Data
  networkSpeedTest: any;
  
  // Dashboard Data
  dashboardCards: any[];
  
  // Theme preference (global, but can be per-user)
  theme: string | null;
}

const USER_DATA_PREFIX = 'user_data_';

// Debounce timers for each user to prevent excessive saves
const saveTimers: { [userId: string]: NodeJS.Timeout } = {};
const SAVE_DEBOUNCE_MS = 500; // 500ms debounce

/**
 * Get user-specific storage key
 */
function getUserDataKey(userId: string): string {
  return `${USER_DATA_PREFIX}${userId}`;
}

/**
 * Get all user data for a specific user
 */
export function getUserData(userId: string): UserData {
  const key = getUserDataKey(userId);
  const data = localStorage.getItem(key);
  
  if (!data) {
    return getDefaultUserData();
  }
  
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return getDefaultUserData();
  }
}

/**
 * Save all user data for a specific user
 */
export function saveUserData(userId: string, data: UserData): void {
  const key = getUserDataKey(userId);
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving user data:', error);
  }
}

/**
 * Save user data with debouncing to prevent excessive writes
 */
export function saveUserDataDebounced(userId: string, data: UserData): void {
  // Clear existing timer for this user
  if (saveTimers[userId]) {
    clearTimeout(saveTimers[userId]);
  }
  
  // Set new timer
  saveTimers[userId] = setTimeout(() => {
    saveUserData(userId, data);
    delete saveTimers[userId];
  }, SAVE_DEBOUNCE_MS);
}

/**
 * Save user data immediately (bypasses debouncing)
 */
export function saveUserDataImmediate(userId: string, data: UserData): void {
  // Clear any pending debounced save
  if (saveTimers[userId]) {
    clearTimeout(saveTimers[userId]);
    delete saveTimers[userId];
  }
  
  // Save immediately
  saveUserData(userId, data);
}

/**
 * Get default user data structure
 */
export function getDefaultUserData(): UserData {
  return {
    flightCount: 0,
    trackedFlightIds: [],
    weatherLocations: [],
    savedBusinesses: [],
    blacklistedBusinesses: [],
    medications: [],
    lastCheckDate: null,
    networkSpeedTest: null,
    dashboardCards: [],
    theme: null,
  };
}

/**
 * Migrate existing localStorage data to user-specific storage
 */
export function migrateToUserData(userId: string): UserData {
  const userData = getDefaultUserData();
  
  // Migrate flight tracker data
  const flightCount = localStorage.getItem('totalFlightsTracked');
  if (flightCount) {
    userData.flightCount = parseInt(flightCount, 10) || 0;
    localStorage.removeItem('totalFlightsTracked');
  }
  
  const trackedIds = localStorage.getItem('trackedFlightIds');
  if (trackedIds) {
    try {
      userData.trackedFlightIds = JSON.parse(trackedIds);
      localStorage.removeItem('trackedFlightIds');
    } catch (error) {
      console.error('Error parsing tracked flight IDs:', error);
    }
  }
  
  // Migrate weather tracker data
  const weatherData = localStorage.getItem('weather-tracker-data');
  if (weatherData) {
    try {
      const parsed = JSON.parse(weatherData);
      userData.weatherLocations = parsed.locations || [];
      localStorage.removeItem('weather-tracker-data');
    } catch (error) {
      console.error('Error parsing weather data:', error);
    }
  }
  
  // Migrate business scraper data
  const savedBusinesses = localStorage.getItem('saved-businesses');
  if (savedBusinesses) {
    try {
      userData.savedBusinesses = JSON.parse(savedBusinesses);
      localStorage.removeItem('saved-businesses');
    } catch (error) {
      console.error('Error parsing saved businesses:', error);
    }
  }
  
  const blacklistedBusinesses = localStorage.getItem('blacklisted-businesses');
  if (blacklistedBusinesses) {
    try {
      userData.blacklistedBusinesses = JSON.parse(blacklistedBusinesses);
      localStorage.removeItem('blacklisted-businesses');
    } catch (error) {
      console.error('Error parsing blacklisted businesses:', error);
    }
  }
  
  // Migrate medication tracker data
  const medicationData = localStorage.getItem('medication-tracker-data');
  if (medicationData) {
    try {
      const parsed = JSON.parse(medicationData);
      userData.medications = parsed || [];
      localStorage.removeItem('medication-tracker-data');
    } catch (error) {
      console.error('Error parsing medication data:', error);
    }
  }
  
  const lastCheckDate = localStorage.getItem('last-check-date');
  if (lastCheckDate) {
    userData.lastCheckDate = lastCheckDate;
    localStorage.removeItem('last-check-date');
  }
  
  // Migrate network speed data
  const networkSpeedData = localStorage.getItem('network-speed-test');
  if (networkSpeedData) {
    try {
      userData.networkSpeedTest = JSON.parse(networkSpeedData);
      localStorage.removeItem('network-speed-test');
    } catch (error) {
      console.error('Error parsing network speed data:', error);
    }
  }
  
  // Theme is global, so we don't migrate it
  
  // Save the migrated data
  saveUserData(userId, userData);
  
  return userData;
}

/**
 * Export user data for backup
 */
export function exportUserData(userId: string): string {
  const userData = getUserData(userId);
  return JSON.stringify(userData, null, 2);
}

/**
 * Import user data from backup
 */
export function importUserData(userId: string, dataString: string): boolean {
  try {
    const userData = JSON.parse(dataString);
    saveUserData(userId, userData);
    return true;
  } catch (error) {
    console.error('Error importing user data:', error);
    return false;
  }
}

/**
 * Clear all user data for a specific user
 */
export function clearUserData(userId: string): void {
  const key = getUserDataKey(userId);
  localStorage.removeItem(key);
}

/**
 * Get all user IDs that have data stored
 */
export function getAllUserIds(): string[] {
  const userIds: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(USER_DATA_PREFIX)) {
      const userId = key.replace(USER_DATA_PREFIX, '');
      userIds.push(userId);
    }
  }
  
  return userIds;
}
